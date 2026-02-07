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

const dayHoursConf= {}
let resultConf = 0
const rootHoursConf = {}

const dayHours = {}
const rootHours = {}
let result = 0

for (let page of pages) {
    let ff_confidence = page.ff_confidence
    if (page.ff_confidence != 0 && !page.ff_confidence) {
        ff_confidence = 4
    }
    ff_confidence *= 0.25

    if (checkCond(page) && page.ff_duration) {

        const hours = page.ff_duration.as("hour")

        let hoursConf = 0
        if (ff_confidence != 0) {
            hoursConf = hours / ff_confidence
            hoursConf = Math.floor(hoursConf * 100) / 100
        }


        result += hours
        resultConf += hoursConf

        addStatistic(rootHours, page, hours)
        addStatistic(rootHoursConf, page, hoursConf)

        addToMapNumber(
            dayHours,
            dv.date(page.ff_date).toISODate(),
            hours
        )

        addToMapNumber(
            dayHoursConf,
            dv.date(page.ff_date).toISODate(),
            hoursConf
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
            let hoursConf = 0
            if (ff_confidence != 0) {
                hoursConf = hours / ff_confidence
                hoursConf = Math.round(hoursConf * 100) / 100
            }

            result += hours
            resultConf += hoursConf

            addStatistic(rootHours, page, hours)
            addStatistic(rootHoursConf, page, hoursConf)

            addToMapNumber(
                dayHours,
                dv.date(i.ff_date).toISODate(),
                hours
            )

            addToMapNumber(
                dayHoursConf,
                dv.date(i.ff_date).toISODate(),
                hoursConf
            )
        }
    }
}
result -= currentDv.ff_offset
resultConf -= currentDv.ff_offset

const getProgress = (countDone, countAll) => {
    const fraction = countDone/countAll
    const percent  = fraction * 100
    const progress = Math.floor( percent * 10) / 10

    return progress
}

function makeProgressBlock({ title, value, max, percentValue = value }) {
  const container = createDiv();
  Object.assign(container.style, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  });

  const bar = container.createEl("progress");
  Object.assign(bar, { max, value });
  Object.assign(bar.style, { width: "100%", height: "10px" });

  container.createEl("div", {
    text: `${getProgress(percentValue, max)}% ${Math.round(value*100)/100}/${max}`,
  });

  // заголовок + блок
  dv.header(4, title);
  dv.paragraph(container);

  return container;
}

// использование
makeProgressBlock({
  title: "Fact",
  value: result,
  max: currentDv.ff_targetCapacity,
});

makeProgressBlock({
  title: "Conf",
  value: resultConf,
  max: currentDv.ff_targetCapacity,
});


// RENDER dayToHours
function renderDayHoursTable({
  title,
  dayHoursObj,
  dateHeader = "ff_date",
  hoursHeader = "hours",
  totalLabel = "all",
}) {
  const rows = [];
  let sum = 0;

  for (const [date, hours] of Object.entries(dayHoursObj ?? {})) {
    sum += hours ?? 0;
    sum = Math.round(sum * 100) / 100;
    hours_ = Math.round(hours * 100) / 100;
    rows.push([date, hours_ ?? 0]);
  }

  rows.sort((a, b) => (a[0] < b[0] ? -1 : 1));
  rows.push([totalLabel, sum]);

  if (title) dv.header(4, title);
  dv.table([dateHeader, hoursHeader], rows);

  return rows;
}

// usage
renderDayHoursTable({ title: "Fact", dayHoursObj: dayHours });
renderDayHoursTable({ title: "Conf", dayHoursObj: dayHoursConf });

// RENDER noteToHours
function renderRootHoursTable({
  title,
  rootHoursObj,
  rootHeader = "root",
  hoursHeader = "hours",
  totalLabel = "all",
}) {
  const rows = [];
  let sum = 0;

  for (const [key, hours] of Object.entries(rootHoursObj ?? {})) {
    let h = hours ?? 0;
    h = Math.round(h * 100) / 100;
    sum += h;
    rows.push([key, h]);
  }

  // по убыванию часов
  rows.sort((a, b) => b[1] - a[1]);

  rows.push([totalLabel, sum]);

  if (title) dv.header(4, title);
  dv.table([rootHeader, hoursHeader], rows);

  return rows;
}

// usage
renderRootHoursTable({ title: "Fact", rootHoursObj: rootHours });
renderRootHoursTable({ title: "Conf", rootHoursObj: rootHoursConf });
