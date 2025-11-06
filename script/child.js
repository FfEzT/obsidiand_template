function getLinkClass() {
    // Создаем временную ссылку для определения класса
    const tempPage = dv.current()
    if (tempPage && tempPage.file && tempPage.file.link) {
        return tempPage.file.link.constructor
    }
    return null
}

function parseTextTick(str) {
    const args = str.split(',')
        if (!args)
            return null

        const name = args[0]?.trim()
        const ff_date = dv.date(args[1]?.trim())
        const ff_timeStart = dv.duration(args[2]?.trim())

        const ff_duration = dv.duration(args[3]?.trim())

        if (name == '')
            return null

        return {name, ff_date, ff_timeStart, ff_duration}
}

function parseArrTick(arr) {
    return {
        name: arr[0],
        ff_date: arr[1],
        ff_timeStart: arr[2],
        ff_duration: arr[3]
    }
}

function convertDvToTarr(t) {
    const res = []
    if (typeof t == "string") {
        const tmp = parseTextTick(t)
        tmp && res.push(tmp)
    }
    else if (typeof t[0] == "number") {
        res.push(parseArrTick(t))
    }
    else for (let i of t) {
        res.push(
            ...convertDvToTarr(i)
        )
    }
    return res
}

function getRenderedTicks(page) {
    if (!page.t)
        return []

    const result = []
    const tmp = convertDvToTarr(page.t)

    for (let i of tmp) {
        result.push(
            ["("+page.file.link+")"+i.name, i.ff_date, page.ff_status]
        )
    }

    result.sort(
        (a,b) => a[1] < b[1]? -1:1
    )

    return result
}

function getRelatedFields(page, searchingPath) {
    const Link = getLinkClass()

    const keys = []
    for (let key in page) {
        const val = page[key]

        if (val instanceof Link) {
            if (val?.path === searchingPath)
                keys.push(key)

            continue
        }
        if ( !(val instanceof Array) )
            continue

        for (let link of val) {
            if ( !(link instanceof Link) )
                continue

            if (link?.path === searchingPath) {
                keys.push(key)

                break
            }
        }
    }
    return keys
}

function getAllLinks(currentPath, defaultField) {
    let pages = dv.pages("[[#]]")
        .sort(p => p.ff_status).sort(p => p.ff_date)
        .array()

    // mapping: fieldName -> List[page]
    const result = {}
    result[defaultField] = []

    for (let page of pages) {
        const keys = getRelatedFields(page, currentPath)

        for (let key of keys) {
            if ( !(result[key] instanceof Array) )
                result[key] = []

            result[key].push(page)
        }
        if (keys.length == 0)
            result[defaultField].push(page)
    }

    return result
}

function renderTicks(ticks) {
    dv.table(
        ["ticks", "ff_date", "ff_status"],
        ticks
    )
}

function renderFields(fieldToPages) {
    for (let field in fieldToPages) {
        const pages = fieldToPages[field]
        if (pages.length == 0)
            continue

        const res = []
        for (let page of pages) {
            res.push(
                [page.file.link, page.ff_date, page.ff_status, page.progress?.replace("current()", "page('" + page.file.path + "')")]
            )
            res.sort(
                (a,b) => a[1] < b[1]? -1:1
            )
        }

        dv.table(
            [field, "ff_date", "ff_status", "progress"],
            res
        )
    }

}

function main() {
    const currentDv = dv.current()

    const links = getAllLinks(currentDv.file.path, "ff_l_related")
    const ticks = getRenderedTicks(currentDv)

    if (ticks.length > 0)
        renderTicks(ticks)

    renderFields(links)
}

main()
