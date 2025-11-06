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

function haveDate(obj) {
    return !!obj.ff_date
}

function checkFile(obj) {
    // return !haveDate(obj) &&
    //     !(obj.ff_status == "🟡blocked" &&
    //             !obj.file?.tasks.fullyCompleted.includes(false) &&
    //             obj.file?.inlinks.length != 0)

    if (haveDate(obj))
        return false

    if (obj.file?.inlinks.length == 0)
        return true

    // if (obj.file?.tasks.fullyCompleted.includes(false))
    //   return true

    const child = obj.file.inlinks.array()
    for (let children of child) {
        const tmp = dv.page(children.path).ff_status

        if (!tmp)
            continue

        // NOTE Если есть дети не Done
        if (!tmp.includes("done"))
            return false
    }

    return true
}

const currentDv = dv.current()
let pages = dv.pages()
.where(
    page => page.file.path.startsWith(currentDv.file.folder)
    && page.ff_status
    && !page.ff_status?.contains("done")
)
.sort(p => p.ff_deadline)
.sort(p => p.ff_impact)
.sort(p => p.ff_confidence)
.sort(p => p.ff_duration)
.sort(p => p.ff_status)
.array()

const result = []

// ff_status, ff_l_parent, replace(progress, "current()", PROG) AS progress
for (let page of pages) {
    if (checkFile(page)) {
        result.push(
            [
                page.file.link,
                page.ff_status,
                page.progress?.replace("current()", "page('" + page.file.path + "')"),
                !!page.ff_deadline||null, // note чтобы показывались "...", а не "false"
                !!page.ff_impact||null, // note чтобы показывались "...", а не "false"
                !!page.ff_confidence||null, // note чтобы показывались "...", а не "false"
                !!page.ff_duration||null, // note чтобы показывались "...", а не "false"
                page.ff_l_parent
            ]
        )
    }
    if (page.t) {
        const tmp = convertDvToTarr(page.t)
        .filter(a => !haveDate(a))

        for (let i of tmp) {
            result.push(
                ["("+page.file.link+")"+i.name, page.ff_status, "", ""]
            )
        }
    }
}

dv.table(
    ["File", "ff_status", "progress", ..."dice", "ff_l_parent"],
    result
)
