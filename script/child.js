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

const currentDv = dv.current()


// GET ff_blocks
let blockers = dv.pages("[[#]]")
.where(
    page => {
        if (page.ff_blocks?.find)
            return page.ff_blocks.find(el => el.path == currentDv.file.path)

        return page.ff_blocks?.path == currentDv.file.path
    }
)
.sort(p => p.ff_status).sort(p => p.ff_date)
.array()

const result_block = []
for (let blocker of blockers) {
    result_block.push(
        [blocker.file.link, blocker.ff_date, blocker.ff_status, blocker.progress?.replace("current()", "page('" + blocker.file.path + "')")]
    )
}
// END GET ff_blocks




// GET others inlinks
let pages = dv.pages("[[#]]")
// .where(
//     page => {
//         console.log(page.ff_parent)
//         if (page.ff_parent?.find)
//             return page.ff_parent.find(el => el.path == currentDv.file.path)

//         return page.ff_parent?.path == currentDv.file.path
//     }
// )
.sort(p => p.ff_status)
.array()

let result = []

let currentPage = dv.current()
if (currentPage.t) {
    const tmp = convertDvToTarr(currentPage.t)

    for (let i of tmp) {
        result.push(
            ["("+currentPage.file.link+")"+i.name, i.ff_date, currentPage.ff_status, "TICK"]
        )
    }
}

// ff_status, ff_parent, replace(progress, "current()", PROG) AS progress
for (let page of pages) {
    result.push(
        [page.file.link, page.ff_date, page.ff_status, page.progress?.replace("current()", "page('" + page.file.path + "')")]
    )
}

result.sort(
    (a,b) => a[1] < b[1]? -1:1
)


// END GET other inlinks

// remove blockers from result
let tempResult = []
for (let i of result) {
    index = result_block.find(
        el => el[0].path == i[0].path
    )

    if (index)
        continue

    tempResult.push(i)
}
result = tempResult




// RENDER
dv.table(
    ["children", "ff_date", "ff_status", "progress"],
    result
)

if (result_block.length)
    dv.table(
        ["blocker", "ff_date", "ff_status", "progress"],
        result_block
    )
