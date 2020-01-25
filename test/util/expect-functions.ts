function getTimestamp(time: string | number | Date) {
  if (typeof time === 'number') {
    return time;
  }

  return new Date(time).getTime();
}

function customExpectCondition(isSuccessful: boolean, failureMessage: string) {
  if (!isSuccessful) {
    fail(failureMessage);
  }
  return true;
}

export function expectDate(time: string | number | Date) {
  const toBeBefore = (afterTime: string | number | Date) =>
    customExpectCondition(
      getTimestamp(time) <= getTimestamp(afterTime),
      `Expected ${time} to be on or before ${afterTime}`
    );
  const toBeAfter = (beforeTime: string | number | Date) =>
    customExpectCondition(
      getTimestamp(time) >= getTimestamp(beforeTime),
      `Expected ${time} to be on or after ${beforeTime}`
    );
  const toBeBetween = (
    beforeTime: string | number | Date,
    afterTime: string | number | Date
  ) =>
    customExpectCondition(
      toBeBefore(afterTime) && toBeAfter(beforeTime),
      `Expected ${time} to be between ${beforeTime} and ${afterTime}`
    );
  return { toBeBefore, toBeAfter, toBeBetween };
}

export function expectString(str: string) {
  return {
    toStartWith: (substring: string) =>
      customExpectCondition(
        str.indexOf(substring) === 0,
        `Expected '${str}' to start with '${substring}'`
      ),
    toContain: (substring: string) =>
      customExpectCondition(
        str.indexOf(substring) >= 0,
        `Expected '${str}' to start contain '${substring}'`
      ),
    toEndWith: (substring: string) =>
      customExpectCondition(
        str.lastIndexOf(substring) === str.length - substring.length,
        `Expected '${str}' to end with '${substring}'`
      ),
    toMatchRegex: (regex: RegExp) =>
      customExpectCondition(
        !!str.match(regex),
        `Expected '${str}' to match ${regex}`
      ),
  };
}
