'use strict'

const merge = require('lodash.merge')

const NOTHING = Symbol('nothing')

export default class Matcher  {

    constructor (expected) {
        this.expected = expected
    }

    match (actual, comparator) {
        return this.check(actual, comparator)
    }

    check (actual, comparator) {

        let actualExpectedMatch = true
        let matchingActual = actual

        const matcherlessExpected = omitMatchers(this.expected)

        // reset actualExpectedMatch if there is something to check
        if (matcherlessExpected !== NOTHING) {

            matchingActual = pickMatching(actual,
                    matcherlessExpected)

            actualExpectedMatch = comparator(matchingActual,
                    matcherlessExpected)

            matchingActual = pickMatching(actual,
                    this.expected)
        }

        let matchers = matchMatchers(actual, this.expected)

        let overallExpected = matcherlessExpected

        if (matchers.expected !== NOTHING) {
            overallExpected = merge({}, matchers.expected,
                    matcherlessExpected)
        }

        const overallMatch = actualExpectedMatch && matchers.match

        const result = { match: overallMatch, actual: matchingActual }

        // expected returned either way because there may be not matching parts
        // somewhere up in the hierarchy so we do not want to test runner to
        // blame this part
        result.expected = overallMatch ? matchingActual : overallExpected

        // inherited flag makes sense only in case of mismatch
        if (!actualExpectedMatch || !matchers.match) {
            result.inherited = actualExpectedMatch && !matchers.match
        }

        return result
    }

    description () {
        return null
    }

}

function pickMatching (actual, expected) {

    if (isMatcher(expected)) {
        return actual
    }

    if (!isObject(actual) || !isObject(expected)) {
        return actual
    }

    let result = {}

    if (Array.isArray(actual)) {
        result = []
    }

    for (let key in expected) {

        if (hasOwn(expected, key) && hasOwn(actual, key)) {
            result[key] = pickMatching(actual[key], expected[key])
        }
    }

    return result
}

function matchMatchers (actual, expected) {

    if (isMatcher(expected)) {

        let matchResult = applyMatch(expected, actual)

        return {
            expected: matchResult.expected,
            match: matchResult.match,
        }
    }

    if (!isObject(expected)) {
        return {
            expected: NOTHING,
            match: true,
        }
    }

    let matched = {},
        match = true,
        somethingMatched = false

    if (Array.isArray(actual)) {
        matched = []
    }

    for (let key in expected) {

        if (hasOwn(expected, key)) {

            let actualValue = isObject(actual)
                ? actual[key]
                : undefined

            const v = matchMatchers(actualValue, expected[key])

            if (v.expected !== NOTHING) {
                matched[key] = v.expected
                match = match && v.match
                somethingMatched = true
            }
        }
    }

    return {
        expected: somethingMatched ? matched : NOTHING,
        match: match,
    }
}

function applyMatch (matcher, arg) {

    const result = matcher.match(arg)
    const description = matcher.description()

    let matched

    if (result.match) {
        matched = arg
    } else if (result.inherited || !description) {
        matched = result.expected
    } else {
        matched = description
    }

    return {
        expected: matched,
        match: result.match,
    }
}

function omitMatchers (expected) {

    if (isMatcher(expected)) {
        return NOTHING
    }

    if (!isObject(expected)) {
        return expected
    }

    let result = {}

    if (Array.isArray(expected)) {
        result = []
    }

    for (let key in expected) {
        if (hasOwn(expected, key) && !isMatcher(expected[key])) {
            result[key] = omitMatchers(expected[key])
        }
    }

    return result
}

function hasOwn (obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key)
}

function isMatcher (obj) {
    return obj instanceof Matcher
}

function isObject (obj) {
    return obj && typeof obj === 'object'
}
