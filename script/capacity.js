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

const varDateDv = dv.page("var/date")
const currentDv = dv.current()

let pages = dv.pages()
.where(
    page => page.file.path.startsWith(currentDv.file.folder)
        && page.ff_status
        && !page.ff_status?.contains("done")
)
.sort(p => p.ff_status)
.array()

let startDay = varDateDv.ff_startDay
function checkCond(obj) {
    if (!obj.ff_timeStart)
        return false

    return obj.ff_date &&
    obj.ff_date < varDateDv.ff_endRange + dv.duration("1d") &&
    obj.ff_date >= startDay
}

const rootHours = {}

function getRoots(page) {
    const pages = new Set()
    const stack = [page.file.path]

    const roots = []
    while (stack.length > 0) {
        const meta = dv.page(stack.pop())

        if (!meta)
            continue

        const isInTheSameRootFolder = (page) => {
            return page.path.startsWith(currentDv.file.folder)
        }

        const outlinks = meta.file.outlinks.array()
        if (outlinks.length == 0 || !outlinks.some(isInTheSameRootFolder)) {
            roots.push(meta)
            continue
        }

        const outlink = outlinks.find(isInTheSameRootFolder)
        if (outlink != undefined) {
            if (pages.has(outlink.path))
                continue

            pages.add(outlink.path)
            stack.push(outlink.path)
        }
    }

    const result = []
    for (let root of roots) {
        if (root.file.path.startsWith(currentDv.file.folder))
            result.push(root)
    }

    return result
}

function addStatistic(map, page, hours) {
    const roots = getRoots(page)

    for (let root of roots) {
        addToMapNumber(map, root.file.path, hours)
    }
}

function addToMapNumber(map, key, num) {
    let value = map[key] || 0
    value += num

    map[key] = value

}

const dayHours = {}
// console.log(dv.date("today").toISODate())

let result = 0
for (let page of pages) {
    if (checkCond(page) && page.ff_duration) {
        const hours = page.ff_duration.as("hour")

        result += hours

        addStatistic(rootHours, page, hours)

        addToMapNumber(
            dayHours,
            dv.date(page.ff_date).toISODate(),
            hours
        )
    }
    if (page.t) {
        const tmp = convertDvToTarr(page.t)
        .filter(a => checkCond(a))

        for (let i of tmp) {
            if (!i.ff_duration) {
                continue
            }
            const hours = i.ff_duration.as("hour")

            result += hours
            addStatistic(rootHours, page, hours)

            addToMapNumber(
                dayHours,
                dv.date(i.ff_date).toISODate(),
                hours
            )
        }
    }
}
result -= currentDv.ff_offset

const getProgress = (countDone, countAll) => {
    const fraction = countDone/countAll
    const percent  = fraction * 100
    const progress = Math.floor( percent * 10) / 10

    return progress
}

const containerEl = createDiv();
Object.assign(containerEl.style, {
    'display': 'flex',
    'flex-direction': 'column',
    'align-items': 'center',
    'justify-content': 'center',
    'width':'100%'
});

const progressBar = containerEl.createEl('progress');
Object.assign(progressBar, {max: currentDv.ff_targetCapacity, value: result});
Object.assign(progressBar.style, {"width":"100%", "height":"10px"});

const progressText = containerEl.createEl('div');
Object.assign(progressText, {
    'textContent': `${getProgress(result, currentDv.ff_targetCapacity)}% ${result}/${currentDv.ff_targetCapacity}`,
});

dv.paragraph(containerEl)

// RENDER dayToHours
const dayToHours = []
let summ = 0
for (let key in dayHours) {
    let hour = dayHours[key]
    summ += hour

    dayToHours.push(
        [key, hour]
    )
}
dayToHours.sort((a,b) => a[0] < b[0]? -1 : 1)
dayToHours.push(["all", summ])
dv.table(
    ["ff_date", "hours"],
    dayToHours
)

// RENDER noteToHours
const rootAndHours = []
summ = 0
for (let key in rootHours) {
    let hour = rootHours[key]
    summ += hour
    rootAndHours.push(
        [dv.page(key).file.link, hour]
    )
}
rootAndHours.sort((a,b) => a[1] > b[1]? -1 : 1)
rootAndHours.push(["all", summ])

dv.table(
    ["root", "hours"],
    rootAndHours
)
