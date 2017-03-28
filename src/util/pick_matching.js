'use strict'

export default function pickMatching (obj, obj2) {

    if (!obj2 || typeof obj2 !== 'object') {
        return obj
    }

    if (!obj || typeof obj !== 'object') {
        return null
    }

    return pickMatchingProps(obj, obj2)

}

function pickMatchingProps (obj, obj2) {

    if (!obj || typeof obj !== 'object' || !obj2 || typeof obj2 !== 'object') {
        return obj
    }

    let result = {}

    if (Array.isArray(obj)) {
        result = []
    }

    for (let key in obj2) {

        if (Object.prototype.hasOwnProperty.call(obj2, key) &&
            Object.prototype.hasOwnProperty.call(obj, key)) {
            result[key] = pickMatchingProps(obj[key], obj2[key])
        }
    }

    return result

}
