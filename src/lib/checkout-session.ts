export function shouldAcceptPrivateCheckoutResponse(
    responseGeneration: number,
    currentGeneration: number,
    expectedUserId: string,
    currentUserId: string | null,
) {
    return (
        responseGeneration === currentGeneration &&
        expectedUserId === currentUserId
    );
}
