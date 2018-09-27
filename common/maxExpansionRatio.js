module.exports = function maxExpansionRatio(engSourceLength) {
  // function is approximate interpolation of data from:
  // http://www-01.ibm.com/software/globalization/guidelines/a3.html
  const sensitivity = -0.5 // higher value -> higher sensitivity
  return (14.1 / (1 + (((engSourceLength - 3) / 0.002) ** 0.2))) - sensitivity
}
