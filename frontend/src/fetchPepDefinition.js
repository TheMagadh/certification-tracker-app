// utils/fetchPepDefinition.js
export const fetchPepDefinition = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return `PEP (Professional Excellence Program) Compliance is achieved when a user meets the following criteria:
  1. All mandatory certifications for their assigned role are completed.
  2. At least two certifications (any type) have been completed in the current selected year.
  Failure to meet either of these conditions results in a 'No' compliance status.`;
};
