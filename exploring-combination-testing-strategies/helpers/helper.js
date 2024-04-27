function generateCombinations(options) {
  const allCombinations = [];

  function generate(index, currentCombination) {
    if (index === options.length) {
      allCombinations.push(currentCombination.slice());
      return;
    }

    currentCombination.push(options[index]);
    generate(index + 1, currentCombination);
    currentCombination.pop();
    generate(index + 1, currentCombination);
  }

  generate(0, []);
  return allCombinations;
}

export default generateCombinations;
