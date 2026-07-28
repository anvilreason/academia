export function calculateResultRecognitionCredits(
  courseCredits: number,
  currentRecognizedCredits: number,
  availableCredits: number,
) {
  const maximumRecognizable = Math.max(0, courseCredits - 1);
  return Math.max(
    0,
    Math.min(
      Math.max(0, availableCredits),
      maximumRecognizable - Math.max(0, currentRecognizedCredits),
    ),
  );
}
