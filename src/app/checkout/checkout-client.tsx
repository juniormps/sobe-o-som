"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Session changes are external events that must clear private checkout state. */

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";

import { useCart } from "@/components/cart/cart-provider";
import type { CheckoutAddress } from "@/lib/address-data";
import {
    ADDRESS_FIELD_LIMITS,
    BRAZILIAN_STATES,
    normalizePostalCode,
    validateAddressInput,
    type AddressField,
} from "@/lib/address-rules";
import {
    mergeCepAutofill,
    shouldAcceptCepResponse,
    type CepAutofillField,
    type CepAutofillValues,
    type CepFieldRevisions,
} from "@/lib/cep-form";
import { shouldAcceptPrivateCheckoutResponse } from "@/lib/checkout-session";

type AddressForm = CepAutofillValues & {
    complement: string;
    hasNoNumber: boolean;
    number: string;
    postalCode: string;
    recipient: string;
};

type ApiResponse = {
    address?: CheckoutAddress;
    error?: string;
    fieldErrors?: Partial<Record<AddressField, string>>;
    ok?: boolean;
};

type CepResponse = {
    address?: CepAutofillValues & { postalCode: string };
    error?: string;
    ok?: boolean;
};

const emptyForm: AddressForm = {
    city: "",
    complement: "",
    district: "",
    hasNoNumber: false,
    number: "",
    postalCode: "",
    recipient: "",
    state: "",
    street: "",
};
const emptyRevisions: CepFieldRevisions = {
    city: 0,
    district: 0,
    state: 0,
    street: 0,
};

export function CheckoutClient({
    initialAddresses,
    sessionUserId,
}: {
    initialAddresses: CheckoutAddress[];
    sessionUserId: string;
}) {
    const { data: session, status: sessionStatus } = useSession();
    const { hydrated, items, refreshCart, resolution, unitCount } = useCart();
    const initialSelectedId =
        initialAddresses.find((address) => address.isDefault)?.id ??
        initialAddresses[0]?.id ??
        null;
    const [addresses, setAddresses] = useState(initialAddresses);
    const [selectedId, setSelectedId] = useState<string | null>(
        initialSelectedId,
    );
    const [confirmedAddress, setConfirmedAddress] =
        useState<CheckoutAddress | null>(null);
    const [showForm, setShowForm] = useState(initialAddresses.length === 0);
    const [form, setForm] = useState<AddressForm>(emptyForm);
    const [fieldErrors, setFieldErrors] = useState<
        Partial<Record<AddressField, string>>
    >({});
    const [message, setMessage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [pendingDefaultId, setPendingDefaultId] = useState<string | null>(
        null,
    );
    const [cepStatus, setCepStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle");
    const [cepMessage, setCepMessage] = useState("");
    const [sessionInvalid, setSessionInvalid] = useState(false);
    const sessionInvalidRef = useRef(false);
    const sessionGenerationRef = useRef(0);
    const selectedIdRef = useRef(selectedId);
    const formRef = useRef(form);
    const fieldRevisionsRef = useRef<CepFieldRevisions>({ ...emptyRevisions });
    const autoFilledByCepRef = useRef<
        Partial<Record<CepAutofillField, string>>
    >({});
    const cepControllerRef = useRef<AbortController | null>(null);
    const cepRequestIdRef = useRef(0);
    const pendingCepRef = useRef<string | null>(null);
    const mutationControllersRef = useRef(new Set<AbortController>());

    useEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);

    useEffect(() => {
        formRef.current = form;
    }, [form]);

    useEffect(() => {
        if (
            sessionStatus === "loading" ||
            session?.user?.id === sessionUserId
        ) {
            return;
        }

        sessionGenerationRef.current += 1;
        cepRequestIdRef.current += 1;
        pendingCepRef.current = null;
        cepControllerRef.current?.abort();
        for (const controller of mutationControllersRef.current) {
            controller.abort();
        }
        mutationControllersRef.current.clear();
        setAddresses([]);
        setSelectedId(null);
        selectedIdRef.current = null;
        setConfirmedAddress(null);
        setShowForm(false);
        setForm(emptyForm);
        formRef.current = emptyForm;
        setFieldErrors({});
        fieldRevisionsRef.current = { ...emptyRevisions };
        autoFilledByCepRef.current = {};
        setMessage(null);
        setSaving(false);
        setConfirming(false);
        setPendingDefaultId(null);
        setCepStatus("idle");
        setCepMessage("");
        setSessionInvalid(true);
    }, [session?.user?.id, sessionStatus, sessionUserId]);

    if (!hydrated) {
        return <CheckoutState message="Restaurando seu carrinho…" />;
    }

    if (sessionStatus === "loading") {
        return <CheckoutState message="Verificando sua sessão…" />;
    }

    const sessionChanged =
        sessionInvalid || session?.user?.id !== sessionUserId;

    if (sessionChanged) {
        return (
            <CheckoutIssue
                href="/login?callbackUrl=/checkout"
                actionLabel="Entrar novamente"
                message="Os dados desta etapa foram limpos para proteger sua conta."
                title="Sua sessão mudou."
            />
        );
    }

    if (items.length === 0) {
        return <EmptyCheckout />;
    }

    if (resolution.status === "idle" || resolution.status === "loading") {
        return <CheckoutState message="Conferindo seu carrinho…" />;
    }

    if (resolution.status === "error") {
        return (
            <CheckoutIssue
                action={refreshCart}
                actionLabel="Tentar novamente"
                message="Não foi possível atualizar preços e disponibilidade. Seus itens continuam no carrinho."
                title="Precisamos conferir o carrinho."
            />
        );
    }

    const hasCartConflict = resolution.items.some((item) => {
        if (item.status === "unavailable" || item.status === "out_of_stock") {
            return true;
        }

        return item.quantity > item.product.stock;
    });

    if (hasCartConflict) {
        return (
            <CheckoutIssue
                href="/carrinho"
                actionLabel="Revisar carrinho"
                message="Há um disco indisponível, esgotado ou com quantidade acima do estoque atual. Ajuste o carrinho antes de escolher o endereço."
                title="Seu carrinho precisa de atenção."
            />
        );
    }

    function resetForm() {
        setForm(emptyForm);
        formRef.current = emptyForm;
        setFieldErrors({});
        fieldRevisionsRef.current = { ...emptyRevisions };
        autoFilledByCepRef.current = {};
        setCepStatus("idle");
        setCepMessage("");
    }

    function selectAddress(addressId: string) {
        selectedIdRef.current = addressId;
        setSelectedId(addressId);
        setConfirmedAddress(null);
        setMessage(null);
    }

    function handlePostalCodeChange(event: ChangeEvent<HTMLInputElement>) {
        const postalCode = event.target.value;
        cepRequestIdRef.current += 1;
        pendingCepRef.current = null;
        cepControllerRef.current?.abort();
        setCepStatus("idle");
        setCepMessage("");
        setFieldErrors((current) => ({
            ...current,
            postalCode: undefined,
        }));

        const next = { ...formRef.current, postalCode };
        const normalized = normalizePostalCode(postalCode);

        for (const field of ["street", "district", "city", "state"] as const) {
            const sourceCep = autoFilledByCepRef.current[field];

            if (sourceCep && sourceCep !== normalized) {
                next[field] = "";
                delete autoFilledByCepRef.current[field];
            }
        }

        formRef.current = next;
        setForm(next);
    }

    function handleAutofillFieldChange(field: CepAutofillField, value: string) {
        fieldRevisionsRef.current[field] += 1;
        delete autoFilledByCepRef.current[field];
        setFormValue(field, value);
    }

    function setFormValue<K extends keyof AddressForm>(
        field: K,
        value: AddressForm[K],
    ) {
        const next = { ...formRef.current, [field]: value };
        formRef.current = next;
        setForm(next);
        setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }

    async function lookupPostalCode() {
        const postalCode = normalizePostalCode(formRef.current.postalCode);

        if (!postalCode) {
            setCepStatus("error");
            setCepMessage("Informe um CEP com oito dígitos.");
            setFieldErrors((current) => ({
                ...current,
                postalCode: "Informe um CEP com oito dígitos.",
            }));
            return;
        }

        if (pendingCepRef.current === postalCode) {
            return;
        }

        cepControllerRef.current?.abort();
        const controller = new AbortController();
        const requestId = cepRequestIdRef.current + 1;
        const revisionsAtRequest = { ...fieldRevisionsRef.current };
        cepControllerRef.current = controller;
        cepRequestIdRef.current = requestId;
        pendingCepRef.current = postalCode;
        setCepStatus("loading");
        setCepMessage("Buscando CEP…");

        try {
            const response = await fetch(`/api/cep/${postalCode}`, {
                cache: "no-store",
                signal: controller.signal,
            });
            const result = (await response.json()) as CepResponse;

            if (
                !shouldAcceptCepResponse(
                    requestId,
                    cepRequestIdRef.current,
                    postalCode,
                    formRef.current.postalCode,
                )
            ) {
                return;
            }

            if (!response.ok || !result.ok || !result.address) {
                setCepStatus("error");
                setCepMessage(
                    result.error ??
                        "Não foi possível consultar. Preencha manualmente ou tente novamente.",
                );
                return;
            }

            const merged = mergeCepAutofill(
                formRef.current,
                result.address,
                revisionsAtRequest,
                fieldRevisionsRef.current,
            );
            const next = { ...formRef.current, ...merged.values };

            for (const field of merged.applied) {
                autoFilledByCepRef.current[field] = postalCode;
            }

            formRef.current = next;
            setForm(next);
            setFieldErrors((current) => {
                const nextErrors = { ...current, postalCode: undefined };

                for (const field of merged.applied) {
                    nextErrors[field] = undefined;
                }

                return nextErrors;
            });
            setCepStatus("success");
            setCepMessage(
                merged.applied.length > 0
                    ? "Dados encontrados. Confira e complete o endereço."
                    : "CEP encontrado. Suas edições foram preservadas; confira os campos.",
            );
        } catch {
            if (!controller.signal.aborted) {
                setCepStatus("error");
                setCepMessage(
                    "Não foi possível consultar. Preencha manualmente ou tente novamente.",
                );
            }
        } finally {
            if (requestId === cepRequestIdRef.current) {
                pendingCepRef.current = null;
            }
        }
    }

    async function saveAddress(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const validation = validateAddressInput(formRef.current);

        if (validation.status === "invalid") {
            setFieldErrors(validation.errors);
            setMessage("Revise os campos indicados.");
            return;
        }

        cepRequestIdRef.current += 1;
        pendingCepRef.current = null;
        cepControllerRef.current?.abort();
        const generation = sessionGenerationRef.current;
        const controller = new AbortController();
        mutationControllersRef.current.add(controller);
        setSaving(true);
        setMessage(null);
        setFieldErrors({});

        try {
            const response = await fetch("/api/addresses", {
                body: JSON.stringify(validation.data),
                headers: { "Content-Type": "application/json" },
                method: "POST",
                signal: controller.signal,
            });
            const result = (await response.json()) as ApiResponse;

            if (
                !shouldAcceptPrivateCheckoutResponse(
                    generation,
                    sessionGenerationRef.current,
                    sessionUserId,
                    session?.user?.id ?? null,
                )
            ) {
                return;
            }

            if (response.status === 401) {
                invalidatePrivateSession();
                return;
            }

            if (!response.ok || !result.ok || !result.address) {
                setFieldErrors(result.fieldErrors ?? {});
                setMessage(
                    response.status === 401
                        ? "Sua sessão expirou. Entre novamente para salvar o endereço."
                        : (result.error ??
                              "Não foi possível salvar. Revise os dados e tente novamente."),
                );
                return;
            }

            setAddresses((current) => [...current, result.address!]);
            selectAddress(result.address.id);
            setShowForm(false);
            resetForm();
            setMessage(
                "Endereço salvo e selecionado. Confirme os dados para continuar.",
            );
        } catch {
            if (!controller.signal.aborted) {
                setMessage(
                    "Não foi possível salvar agora. Seus dados foram preservados para uma nova tentativa.",
                );
            }
        } finally {
            mutationControllersRef.current.delete(controller);
            if (
                shouldAcceptPrivateCheckoutResponse(
                    generation,
                    sessionGenerationRef.current,
                    sessionUserId,
                    session?.user?.id ?? null,
                )
            ) {
                setSaving(false);
            }
        }
    }

    async function setAsDefault(addressId: string) {
        const generation = sessionGenerationRef.current;
        const controller = new AbortController();
        mutationControllersRef.current.add(controller);
        setPendingDefaultId(addressId);
        setMessage(null);

        try {
            const response = await fetch(
                `/api/addresses/${addressId}/default`,
                {
                    body: "{}",
                    headers: { "Content-Type": "application/json" },
                    method: "PATCH",
                    signal: controller.signal,
                },
            );
            const result = (await response.json()) as ApiResponse;

            if (
                !shouldAcceptPrivateCheckoutResponse(
                    generation,
                    sessionGenerationRef.current,
                    sessionUserId,
                    session?.user?.id ?? null,
                )
            ) {
                return;
            }

            if (response.status === 401) {
                invalidatePrivateSession();
                return;
            }

            if (!response.ok || !result.ok || !result.address) {
                setMessage(
                    response.status === 401
                        ? "Sua sessão expirou. Entre novamente para alterar o principal."
                        : (result.error ??
                              "Não foi possível alterar o endereço principal."),
                );
                return;
            }

            setAddresses((current) =>
                current.map((address) => ({
                    ...address,
                    isDefault: address.id === addressId,
                })),
            );
            setMessage("Endereço principal alterado.");
        } catch {
            if (!controller.signal.aborted) {
                setMessage("Não foi possível alterar o principal agora.");
            }
        } finally {
            mutationControllersRef.current.delete(controller);
            if (
                shouldAcceptPrivateCheckoutResponse(
                    generation,
                    sessionGenerationRef.current,
                    sessionUserId,
                    session?.user?.id ?? null,
                )
            ) {
                setPendingDefaultId(null);
            }
        }
    }

    async function confirmAddress() {
        const addressId = selectedIdRef.current;

        if (!addressId) {
            setMessage("Escolha um endereço antes de confirmar.");
            return;
        }

        const generation = sessionGenerationRef.current;
        const controller = new AbortController();
        mutationControllersRef.current.add(controller);
        setConfirming(true);
        setMessage(null);

        try {
            const response = await fetch("/api/checkout/address-confirmation", {
                body: JSON.stringify({ addressId }),
                headers: { "Content-Type": "application/json" },
                method: "POST",
                signal: controller.signal,
            });
            const result = (await response.json()) as ApiResponse;

            if (
                !shouldAcceptPrivateCheckoutResponse(
                    generation,
                    sessionGenerationRef.current,
                    sessionUserId,
                    session?.user?.id ?? null,
                ) ||
                addressId !== selectedIdRef.current
            ) {
                return;
            }

            if (response.status === 401) {
                invalidatePrivateSession();
                return;
            }

            if (!response.ok || !result.ok || !result.address) {
                setMessage(
                    response.status === 401
                        ? "Sua sessão expirou. Entre novamente para confirmar o endereço."
                        : (result.error ??
                              "Não foi possível confirmar o endereço."),
                );
                return;
            }

            setConfirmedAddress(result.address);
            setShowForm(false);
            setMessage("Endereço confirmado para esta etapa.");
        } catch {
            if (!controller.signal.aborted) {
                setMessage(
                    "Não foi possível confirmar agora. Tente novamente.",
                );
            }
        } finally {
            mutationControllersRef.current.delete(controller);
            if (
                shouldAcceptPrivateCheckoutResponse(
                    generation,
                    sessionGenerationRef.current,
                    sessionUserId,
                    session?.user?.id ?? null,
                )
            ) {
                setConfirming(false);
            }
        }
    }

    function invalidatePrivateSession() {
        if (sessionInvalidRef.current) {
            return;
        }

        sessionInvalidRef.current = true;
        sessionGenerationRef.current += 1;
        cepRequestIdRef.current += 1;
        pendingCepRef.current = null;
        cepControllerRef.current?.abort();
        for (const controller of mutationControllersRef.current) {
            controller.abort();
        }
        mutationControllersRef.current.clear();
        setAddresses([]);
        setSelectedId(null);
        selectedIdRef.current = null;
        setConfirmedAddress(null);
        setShowForm(false);
        resetForm();
        setMessage(null);
        setSaving(false);
        setConfirming(false);
        setPendingDefaultId(null);
        setSessionInvalid(true);

        void signOut({ callbackUrl: "/login", redirect: false }).finally(() => {
            window.location.assign(
                new URL("/login?callbackUrl=/checkout", window.location.origin),
            );
        });
    }

    return (
        <main
            className="bg-[#F4F0E9] px-4 py-10 text-[#241C19] sm:px-6 sm:py-14 lg:px-10 lg:py-18"
            id="main-content"
        >
            <div className="mx-auto grid w-full max-w-[90rem] gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
                <section className="bg-white p-5 shadow-[8px_8px_0_#241C19] sm:p-8 lg:p-10">
                    <p className="text-xs font-black tracking-[0.2em] text-[#9F2F1A] uppercase">
                        Checkout demonstrativo
                    </p>
                    <h1 className="mt-2 text-4xl leading-none font-black tracking-[-0.055em] sm:text-6xl">
                        Onde seria a entrega?
                    </h1>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6B625E] sm:text-base">
                        Escolha e confirme um endereço. Esta loja é uma
                        demonstração: não haverá envio, frete ou entrega real.
                    </p>

                    <p
                        aria-live="polite"
                        className={`mt-6 border-l-4 px-4 py-3 text-sm leading-6 ${
                            message
                                ? "border-[#B63E25] bg-[#FFF3E2]"
                                : "sr-only"
                        }`}
                        role="status"
                    >
                        {message}
                    </p>

                    {confirmedAddress ? (
                        <div className="mt-8 border-2 border-[#241C19] p-5 sm:p-7">
                            <p className="text-xs font-black tracking-[0.16em] text-[#39704C] uppercase">
                                Endereço confirmado
                            </p>
                            <AddressDetails address={confirmedAddress} />
                            <button
                                className="mt-6 min-h-11 rounded-full border border-[#241C19] px-5 py-2 text-sm font-black hover:bg-[#F4F0E9] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B63E25]"
                                onClick={() => {
                                    setConfirmedAddress(null);
                                    setMessage(null);
                                }}
                                type="button"
                            >
                                Voltar à seleção
                            </button>
                            <p className="mt-5 text-sm leading-6 text-[#6B625E]">
                                Nenhum pedido foi criado e seu carrinho não foi
                                alterado.
                            </p>
                        </div>
                    ) : (
                        <>
                            {addresses.length > 0 ? (
                                <fieldset className="mt-8">
                                    <legend className="text-xl font-black">
                                        Escolha um endereço
                                    </legend>
                                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                                        {addresses.map((address) => (
                                            <AddressOption
                                                address={address}
                                                defaultChangePending={
                                                    pendingDefaultId !== null
                                                }
                                                key={address.id}
                                                onDefault={() =>
                                                    void setAsDefault(
                                                        address.id,
                                                    )
                                                }
                                                onSelect={() =>
                                                    selectAddress(address.id)
                                                }
                                                pendingDefault={
                                                    pendingDefaultId ===
                                                    address.id
                                                }
                                                selected={
                                                    selectedId === address.id
                                                }
                                            />
                                        ))}
                                    </div>
                                </fieldset>
                            ) : null}

                            {addresses.length > 0 && !showForm ? (
                                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                    <button
                                        className="min-h-12 rounded-full bg-[#241C19] px-6 py-3 text-sm font-black text-white hover:bg-[#B63E25] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B63E25] disabled:cursor-wait disabled:opacity-60"
                                        disabled={!selectedId || confirming}
                                        onClick={() => void confirmAddress()}
                                        type="button"
                                    >
                                        {confirming
                                            ? "Confirmando…"
                                            : "Confirmar endereço"}
                                    </button>
                                    <button
                                        className="min-h-12 rounded-full border border-[#241C19] px-6 py-3 text-sm font-black hover:bg-[#F4F0E9] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B63E25]"
                                        onClick={() => {
                                            resetForm();
                                            setShowForm(true);
                                            setMessage(null);
                                        }}
                                        type="button"
                                    >
                                        Cadastrar novo
                                    </button>
                                </div>
                            ) : null}

                            {showForm ? (
                                <AddressFormSection
                                    addressesExist={addresses.length > 0}
                                    cepMessage={cepMessage}
                                    cepStatus={cepStatus}
                                    fieldErrors={fieldErrors}
                                    form={form}
                                    onAutofillChange={handleAutofillFieldChange}
                                    onCancel={
                                        addresses.length > 0
                                            ? () => {
                                                  resetForm();
                                                  setShowForm(false);
                                                  setMessage(null);
                                              }
                                            : undefined
                                    }
                                    onChange={setFormValue}
                                    onPostalCodeChange={handlePostalCodeChange}
                                    onPostalCodeLookup={() =>
                                        void lookupPostalCode()
                                    }
                                    onSubmit={saveAddress}
                                    saving={saving}
                                />
                            ) : null}
                        </>
                    )}
                </section>

                <aside className="bg-[#241C19] p-6 text-white lg:sticky lg:top-5">
                    <p className="text-xs font-black tracking-[0.16em] text-[#F3C76A] uppercase">
                        Sua seleção
                    </p>
                    <p className="mt-3 text-3xl font-black">{unitCount}</p>
                    <p className="text-sm text-[#E7DED5]">
                        {unitCount === 1 ? "unidade" : "unidades"} no carrinho
                    </p>
                    <p className="mt-5 border-t border-white/25 pt-5 text-sm leading-6 text-[#E7DED5]">
                        A disponibilidade já foi conferida para esta etapa, mas
                        o estoque não foi reservado ou alterado.
                    </p>
                    <Link
                        className="mt-6 inline-flex min-h-11 items-center text-sm font-black underline decoration-[#F3C76A] decoration-2 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#F3C76A]"
                        href="/carrinho"
                    >
                        Voltar ao carrinho
                    </Link>
                </aside>
            </div>
        </main>
    );
}

function AddressOption({
    address,
    defaultChangePending,
    onDefault,
    onSelect,
    pendingDefault,
    selected,
}: {
    address: CheckoutAddress;
    defaultChangePending: boolean;
    onDefault: () => void;
    onSelect: () => void;
    pendingDefault: boolean;
    selected: boolean;
}) {
    return (
        <div
            className={`relative border-2 p-4 ${
                selected ? "border-[#B63E25] bg-[#FFF8EE]" : "border-[#D8D0C5]"
            }`}
        >
            <label className="flex cursor-pointer items-start gap-3">
                <input
                    checked={selected}
                    className="mt-1 size-5 accent-[#B63E25] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B63E25]"
                    name="checkout-address"
                    onChange={onSelect}
                    type="radio"
                    value={address.id}
                />
                <span className="min-w-0">
                    {address.isDefault ? (
                        <span className="text-xs font-black tracking-[0.12em] text-[#39704C] uppercase">
                            Principal
                        </span>
                    ) : null}
                    <AddressDetails address={address} compact />
                </span>
            </label>
            {!address.isDefault ? (
                <button
                    className="mt-4 min-h-11 text-left text-sm font-black underline decoration-[#B63E25] decoration-2 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#B63E25] disabled:cursor-wait disabled:opacity-60"
                    disabled={defaultChangePending}
                    onClick={onDefault}
                    type="button"
                >
                    {pendingDefault
                        ? "Alterando principal…"
                        : "Definir como principal"}
                </button>
            ) : null}
        </div>
    );
}

function AddressDetails({
    address,
    compact = false,
}: {
    address: CheckoutAddress;
    compact?: boolean;
}) {
    return (
        <div className={compact ? "mt-1 text-sm leading-6" : "mt-3 leading-7"}>
            <p className="font-black">{address.recipient}</p>
            <p>
                {address.street}, {address.hasNoNumber ? "s/n" : address.number}
            </p>
            {address.complement ? <p>{address.complement}</p> : null}
            <p>{address.district || "Bairro não informado"}</p>
            <p>
                {address.city} - {address.state}
            </p>
            <p>CEP {formatPostalCode(address.postalCode)}</p>
        </div>
    );
}

function AddressFormSection({
    addressesExist,
    cepMessage,
    cepStatus,
    fieldErrors,
    form,
    onAutofillChange,
    onCancel,
    onChange,
    onPostalCodeChange,
    onPostalCodeLookup,
    onSubmit,
    saving,
}: {
    addressesExist: boolean;
    cepMessage: string;
    cepStatus: "idle" | "loading" | "success" | "error";
    fieldErrors: Partial<Record<AddressField, string>>;
    form: AddressForm;
    onAutofillChange: (field: CepAutofillField, value: string) => void;
    onCancel?: () => void;
    onChange: <K extends keyof AddressForm>(
        field: K,
        value: AddressForm[K],
    ) => void;
    onPostalCodeChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onPostalCodeLookup: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    saving: boolean;
}) {
    return (
        <section className="mt-8 border-t-2 border-[#241C19] pt-7">
            <h2 className="text-2xl font-black">
                {addressesExist ? "Novo endereço" : "Cadastre seu endereço"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6B625E]">
                A busca de CEP é opcional. Todos os campos continuam editáveis
                para preenchimento manual.
            </p>
            <form onSubmit={onSubmit}>
                <fieldset
                    className="mt-6 grid gap-5 sm:grid-cols-2"
                    disabled={saving}
                >
                    <legend className="sr-only">Dados do endereço</legend>
                    <FormField
                        autoComplete="name"
                        error={fieldErrors.recipient}
                        field="recipient"
                        label="Destinatário"
                        maxLength={ADDRESS_FIELD_LIMITS.recipient}
                        onChange={(value) => onChange("recipient", value)}
                        value={form.recipient}
                        wide
                    />
                    <div>
                        <label
                            className="text-sm font-black"
                            htmlFor="address-postal-code"
                        >
                            CEP
                        </label>
                        <div className="mt-2 flex flex-col gap-2 min-[390px]:flex-row">
                            <input
                                aria-describedby={
                                    fieldErrors.postalCode
                                        ? "address-postal-code-error cep-feedback"
                                        : "cep-feedback"
                                }
                                aria-invalid={Boolean(fieldErrors.postalCode)}
                                autoComplete="postal-code"
                                className="min-h-12 min-w-0 flex-1 border-2 border-[#B8AFA8] bg-white px-4 outline-none focus:border-[#241C19] focus-visible:ring-3 focus-visible:ring-[#B63E25]/30"
                                id="address-postal-code"
                                inputMode="numeric"
                                maxLength={9}
                                name="postalCode"
                                onChange={onPostalCodeChange}
                                placeholder="00000-000"
                                required
                                type="text"
                                value={form.postalCode}
                            />
                            <button
                                className="min-h-12 shrink-0 rounded-full border border-[#241C19] px-5 text-sm font-black hover:bg-[#F4F0E9] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B63E25] disabled:cursor-wait disabled:opacity-60"
                                disabled={cepStatus === "loading"}
                                onClick={onPostalCodeLookup}
                                type="button"
                            >
                                {cepStatus === "loading"
                                    ? "Buscando…"
                                    : "Buscar CEP"}
                            </button>
                        </div>
                        {fieldErrors.postalCode ? (
                            <FieldError
                                id="address-postal-code-error"
                                message={fieldErrors.postalCode}
                            />
                        ) : null}
                        <p
                            aria-live="polite"
                            className={`mt-2 text-sm ${
                                cepStatus === "error"
                                    ? "font-bold text-[#8B2918]"
                                    : "text-[#5D5551]"
                            }`}
                            id="cep-feedback"
                            role="status"
                        >
                            {cepMessage}
                        </p>
                    </div>
                    <div className="hidden sm:block" />
                    <FormField
                        autoComplete="street-address"
                        error={fieldErrors.street}
                        field="street"
                        label="Logradouro"
                        maxLength={ADDRESS_FIELD_LIMITS.street}
                        onChange={(value) => onAutofillChange("street", value)}
                        value={form.street}
                        wide
                    />
                    <FormField
                        autoComplete="off"
                        disabled={form.hasNoNumber}
                        error={fieldErrors.number}
                        field="number"
                        label="Número"
                        maxLength={ADDRESS_FIELD_LIMITS.number}
                        onChange={(value) => onChange("number", value)}
                        required={!form.hasNoNumber}
                        value={form.number}
                    />
                    <div className="flex items-center pt-2 sm:pt-8">
                        <label className="flex min-h-11 cursor-pointer items-center gap-3 font-bold">
                            <input
                                checked={form.hasNoNumber}
                                className="size-5 accent-[#B63E25] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B63E25]"
                                name="hasNoNumber"
                                onChange={(event) => {
                                    onChange(
                                        "hasNoNumber",
                                        event.target.checked,
                                    );
                                    if (event.target.checked) {
                                        onChange("number", "");
                                    }
                                }}
                                type="checkbox"
                            />
                            Sem número
                        </label>
                    </div>
                    <FormField
                        autoComplete="address-line2"
                        error={fieldErrors.complement}
                        field="complement"
                        label="Complemento (opcional)"
                        maxLength={ADDRESS_FIELD_LIMITS.complement}
                        onChange={(value) => onChange("complement", value)}
                        value={form.complement}
                    />
                    <FormField
                        autoComplete="address-level3"
                        error={fieldErrors.district}
                        field="district"
                        label="Bairro (opcional)"
                        maxLength={ADDRESS_FIELD_LIMITS.district}
                        onChange={(value) =>
                            onAutofillChange("district", value)
                        }
                        value={form.district}
                    />
                    <FormField
                        autoComplete="address-level2"
                        error={fieldErrors.city}
                        field="city"
                        label="Cidade"
                        maxLength={ADDRESS_FIELD_LIMITS.city}
                        onChange={(value) => onAutofillChange("city", value)}
                        value={form.city}
                    />
                    <div>
                        <label
                            className="text-sm font-black"
                            htmlFor="address-state"
                        >
                            UF
                        </label>
                        <select
                            aria-describedby={
                                fieldErrors.state
                                    ? "address-state-error"
                                    : undefined
                            }
                            aria-invalid={Boolean(fieldErrors.state)}
                            autoComplete="address-level1"
                            className="mt-2 min-h-12 w-full border-2 border-[#B8AFA8] bg-white px-4 outline-none focus:border-[#241C19] focus-visible:ring-3 focus-visible:ring-[#B63E25]/30"
                            id="address-state"
                            name="state"
                            onChange={(event) =>
                                onAutofillChange("state", event.target.value)
                            }
                            required
                            value={form.state}
                        >
                            <option value="">Selecione</option>
                            {BRAZILIAN_STATES.map((state) => (
                                <option key={state} value={state}>
                                    {state}
                                </option>
                            ))}
                        </select>
                        {fieldErrors.state ? (
                            <FieldError
                                id="address-state-error"
                                message={fieldErrors.state}
                            />
                        ) : null}
                    </div>
                    <div className="flex flex-col gap-3 pt-2 sm:col-span-2 sm:flex-row">
                        <button
                            className="min-h-12 rounded-full bg-[#241C19] px-6 py-3 text-sm font-black text-white hover:bg-[#B63E25] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B63E25] disabled:cursor-wait disabled:opacity-60"
                            disabled={saving}
                            type="submit"
                        >
                            {saving ? "Salvando…" : "Salvar endereço"}
                        </button>
                        {onCancel ? (
                            <button
                                className="min-h-12 rounded-full border border-[#241C19] px-6 py-3 text-sm font-black hover:bg-[#F4F0E9] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B63E25]"
                                disabled={saving}
                                onClick={onCancel}
                                type="button"
                            >
                                Cancelar
                            </button>
                        ) : null}
                    </div>
                </fieldset>
            </form>
        </section>
    );
}

function FormField({
    autoComplete,
    disabled = false,
    error,
    field,
    label,
    maxLength,
    onChange,
    required = true,
    value,
    wide = false,
}: {
    autoComplete: string;
    disabled?: boolean;
    error?: string;
    field: AddressField;
    label: string;
    maxLength: number;
    onChange: (value: string) => void;
    required?: boolean;
    value: string;
    wide?: boolean;
}) {
    const id = `address-${field}`;

    return (
        <div className={wide ? "sm:col-span-2" : undefined}>
            <label className="text-sm font-black" htmlFor={id}>
                {label}
            </label>
            <input
                aria-describedby={error ? `${id}-error` : undefined}
                aria-invalid={Boolean(error)}
                autoComplete={autoComplete}
                className="mt-2 min-h-12 w-full border-2 border-[#B8AFA8] bg-white px-4 outline-none focus:border-[#241C19] focus-visible:ring-3 focus-visible:ring-[#B63E25]/30 disabled:bg-[#EEEAE3]"
                disabled={disabled}
                id={id}
                maxLength={maxLength}
                name={field}
                onChange={(event) => onChange(event.target.value)}
                required={required}
                type="text"
                value={value}
            />
            {error ? <FieldError id={`${id}-error`} message={error} /> : null}
        </div>
    );
}

function FieldError({ id, message }: { id: string; message: string }) {
    return (
        <p className="mt-2 text-sm font-bold text-[#8B2918]" id={id}>
            {message}
        </p>
    );
}

function CheckoutState({ message }: { message: string }) {
    return (
        <main
            aria-busy="true"
            className="min-h-[32rem] bg-white px-4 py-14 text-[#241C19] sm:px-6 lg:px-10"
            id="main-content"
        >
            <div className="mx-auto w-full max-w-[90rem]">
                <p className="text-sm font-bold" role="status">
                    {message}
                </p>
                <div className="mt-6 h-64 animate-pulse rounded-sm bg-[#EEEAE3] motion-reduce:animate-none" />
            </div>
        </main>
    );
}

function EmptyCheckout() {
    return (
        <CheckoutIssue
            href="/#catalogo"
            actionLabel="Explorar discos"
            message="Adicione pelo menos um disco antes de escolher o endereço."
            title="Seu carrinho está vazio."
        />
    );
}

function CheckoutIssue({
    action,
    actionLabel,
    href,
    message,
    title,
}: {
    action?: () => void;
    actionLabel: string;
    href?: string;
    message: string;
    title: string;
}) {
    const actionClassName =
        "mt-7 inline-flex min-h-12 items-center rounded-full bg-[#241C19] px-6 py-3 text-sm font-black text-white hover:bg-[#B63E25] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B63E25]";

    return (
        <main
            className="flex min-h-[35rem] items-center bg-[#F4F0E9] px-4 py-16 text-[#241C19] sm:px-6 lg:px-10"
            id="main-content"
        >
            <section className="mx-auto w-full max-w-xl bg-white p-7 shadow-[10px_10px_0_#241C19] sm:p-10">
                <p className="text-xs font-black tracking-[0.2em] text-[#9F2F1A] uppercase">
                    Checkout
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">
                    {title}
                </h1>
                <p className="mt-4 leading-7 text-[#6B625E]">{message}</p>
                {href ? (
                    <Link className={actionClassName} href={href}>
                        {actionLabel}
                    </Link>
                ) : (
                    <button
                        className={actionClassName}
                        onClick={action}
                        type="button"
                    >
                        {actionLabel}
                    </button>
                )}
            </section>
        </main>
    );
}

function formatPostalCode(postalCode: string) {
    return postalCode.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}
