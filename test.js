// ghetto unit tests: just run it as a script
//   node test.js
//   node --inspect-brk test.js // to debug
const objectUnderTest = require('./MergeCalendarsTogether.gs')

it('should find event in origin when it exists', () => {
  const origin = {primary: {
    [new Date(1111).toUTCString()]: [{ summary: 'Find me' }]
  }}
  const mergedEvent = {
    start: {dateTime: 1111},
    summary: `${objectUnderTest.MERGE_PREFIX}Find me`
  }
  return objectUnderTest.ExistsInOrigin(origin, mergedEvent)
})

it('should NOT find event in origin when it does not exist', () => {
  const origin = {primary: {
    [new Date(1111).toUTCString()]: [{ summary: 'Do not find me' }]
  }}
  const mergedEvent = {
    start: {dateTime: 1111},
    summary: `${objectUnderTest.MERGE_PREFIX}Will not find anything`
  }
  return !objectUnderTest.ExistsInOrigin(origin, mergedEvent)
})

it('should find event in destination when it exists', () => {
  objectUnderTest.TEST_INCLUDE_DESC = true
  const destination = {merged: {
    [new Date(1111).toUTCString()]: [{
      summary: `${objectUnderTest.MERGE_PREFIX}Find me`,
      description: 'some desc'
    }]
  }}
  const originEvent = {
    start: {dateTime: 1111},
    summary: 'Find me',
    description: 'some desc'
  }
  return objectUnderTest.ExistsInDestination(destination, originEvent)
})

it('should NOT find event in origin when summary does not match', () => {
  const destination = {merged: {
    [new Date(1111).toUTCString()]: [{
      summary: `${objectUnderTest.MERGE_PREFIX}Do not find me`,
      description: 'asdf'
    }]
  }}
  const originEvent = {
    start: {dateTime: 1111},
    summary: 'Will not find anything',
    description: 'asdf'
  }
  return !objectUnderTest.ExistsInDestination(destination, originEvent)
})

it('should NOT find event in origin when description does not match; not obscured', () => {
  objectUnderTest.TEST_INCLUDE_DESC = true
  const destination = {merged: {
    [new Date(1111).toUTCString()]: [{
      summary: `${objectUnderTest.MERGE_PREFIX}Matches`,
      description: objectUnderTest.DESC_NOT_COPIED_MSG
    }]
  }}
  const originEvent = {
    start: {dateTime: 1111},
    summary: 'Matches',
    description: 'one'
  }
  return !objectUnderTest.ExistsInDestination(destination, originEvent)
})

it('should NOT find event in origin when description does not match; is obscured', () => {
  objectUnderTest.TEST_INCLUDE_DESC = false
  const destination = {merged: {
    [new Date(1111).toUTCString()]: [{
      summary: `${objectUnderTest.MERGE_PREFIX}Matches`,
      description: 'should be obscured'
    }]
  }}
  const originEvent = {
    start: {dateTime: 1111},
    summary: 'Matches',
    description: 'one'
  }
  return !objectUnderTest.ExistsInDestination(destination, originEvent)
})

it('should find when desc incorrectly excluded', () => {
  objectUnderTest.TEST_INCLUDE_DESC = true
  const event = { description: objectUnderTest.DESC_NOT_COPIED_MSG }
  return objectUnderTest.isDescWrong(event)
})

it('should find when desc is incorrectly included', () => {
  objectUnderTest.TEST_INCLUDE_DESC = false
  const event = { description: 'blah blah' }
  return objectUnderTest.isDescWrong(event)
})

it('should pass when desc is correctly included', () => {
  objectUnderTest.TEST_INCLUDE_DESC = true
  const event = { description: 'blah blah' }
  return !objectUnderTest.isDescWrong(event)
})

it('should pass when desc is correctly excluded', () => {
  objectUnderTest.TEST_INCLUDE_DESC = false
  const event = { description: objectUnderTest.DESC_NOT_COPIED_MSG }
  return !objectUnderTest.isDescWrong(event)
})

it('should end up with events in primary', () => {
  const primaryEvent = {
    start: {dateTime: 1111},
    summary: 'I am primary event',
  }
  const calendar = objectUnderTest.SortEvents(1, {items: [primaryEvent]})
  const primaryDateTime = calendar.primary[new Date(1111).toUTCString()]
  return primaryDateTime.length === 1 && primaryDateTime[0].summary === primaryEvent.summary
})

it('should end up with events in merged', () => {
  const mergedEvent = {
    start: {dateTime: 1111},
    summary: `${objectUnderTest.MERGE_PREFIX}I am merged event`,
  }
  const calendar = objectUnderTest.SortEvents(1, {items: [mergedEvent]})
  const mergedDateTime = calendar.merged[new Date(1111).toUTCString()]
  return mergedDateTime.length === 1 && mergedDateTime[0].summary === mergedEvent.summary
})

it('should obfuscate the summary and description of a matched', () => {
  objectUnderTest.TEST_INCLUDE_DESC = true // description sync turned on should be overridden
  const obfuscatePattern = '(S|s)ensitive'
  objectUnderTest.OBFUSCATE_LIST_REGEXES.push(obfuscatePattern)
  const primaryEvent = {
    start: {dateTime: 3333},
    summary: 'I am a sensitive event',
    description: 'blah blah',
  }
  const calendar = objectUnderTest.SortEvents(1, {items: [primaryEvent]})
  objectUnderTest.OBFUSCATE_LIST_REGEXES.pop()
  const primaryDateTime = calendar.primary[new Date(3333).toUTCString()]
  const isSummaryObfuscated = primaryDateTime[0].summary === objectUnderTest.SUMMARY_NOT_COPIED_MSG
  const isDescObfuscated = primaryDateTime[0].description === objectUnderTest.DESC_NOT_COPIED_MSG
  return primaryDateTime.length === 1 && isSummaryObfuscated && isDescObfuscated
})

it('should filter off ignore regexes', () => {
  const ignorable = 'TEST ignore me'
  objectUnderTest.IGNORE_LIST_REGEXES.push(ignorable)
  const event = {
    start: {dateTime: 1111},
    summary: ignorable,
  }
  const result = objectUnderTest.IsOnIgnoreList(event)
  objectUnderTest.IGNORE_LIST_REGEXES.pop()
  return result
})

it('should NOT filter off ignore regexes', () => {
  const ignorable = 'TEST ignore me'
  objectUnderTest.IGNORE_LIST_REGEXES.push(ignorable)
  const event = {
    start: {dateTime: 1111},
    summary: '2 legit 2 quit',
  }
  const result = !objectUnderTest.IsOnIgnoreList(event)
  objectUnderTest.IGNORE_LIST_REGEXES.pop()
  return result
})

it('should match a summary to obfuscate', () => {
  const obfuscatePattern = '(S|s)ensitive'
  objectUnderTest.OBFUSCATE_LIST_REGEXES.push(obfuscatePattern)
  const event = {
    start: {dateTime: 1111},
    summary: 'Blah Sensitive foo bar',
  }
  const result = objectUnderTest.IsOnObfuscateList(event)
  objectUnderTest.OBFUSCATE_LIST_REGEXES.pop()
  return result
})

it('should NOT match a summary to obfuscate', () => {
  const obfuscatePattern = '(S|s)ensitive'
  objectUnderTest.OBFUSCATE_LIST_REGEXES.push(obfuscatePattern)
  const event = {
    start: {dateTime: 1111},
    summary: 'Just a normal event',
  }
  const result = !objectUnderTest.IsOnObfuscateList(event)
  objectUnderTest.OBFUSCATE_LIST_REGEXES.pop()
  return result
})

function it(msg, fn) {
  try {
    if (fn()) {
      console.info(`PASS: ${msg}`)
      return
    }
    console.warn(`FAIL(assertion): ${msg}`)
  } catch (err) {
    console.error(`FAIL(error): ${msg}; error=${err.toString()}`)
  }
  process.exitCode = 1
}
