function getLinkClass() {
    const tempPage = dv.current()
    if (tempPage?.file?.link) {
        return tempPage.file.link.constructor
    }
    return null
}
const Link = getLinkClass()

const calcDoneTasks = (page) => {
    let countDone = 0
    for (let i of page.tasks.array()) {
        const strInStatus = i.status.trim()
        if (!!strInStatus)
            ++countDone
    }

    return countDone
}

const calcAllTasks = page => {
    return page.tasks.array().length
}

const getProgress = (countDone, countAll) => {
    const fraction = countDone/countAll
    const percent  = fraction * 100
    const progress = Math.floor( percent * 10) / 10

    return progress
}

let countAll  = 0
let countDone = 0

const page = dv.page(input.file).file.path
const pages = new Set()
const stack = [page]
while (stack.length > 0) {
    const meta = dv.page(stack.pop())

    if (!meta)
        continue

    countAll  += calcAllTasks(meta.file)
    countDone += calcDoneTasks(meta.file)

    const inlinks = meta.file.inlinks.array()
    if (meta.ff_status) {
        ++countAll

        if (meta.ff_status.includes("done"))
            ++countDone
    }

    for (let inlink of inlinks) {
        if (pages.has(inlink.path))
            continue

        pages.add(inlink.path)

        const page = dv.page(inlink.path)

        if (page.ff_l_parent instanceof Link
            && page.ff_l_parent.path === meta.file.path)
        {
            stack.push(inlink.path)
        }
        else if (page.ff_l_parent instanceof Array) {
            const cond = page.ff_l_parent.some(
                el => el instanceof Link && el.path === meta.file.path
            )

            cond && stack.push(inlink.path)
        }
    }
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
Object.assign(progressBar, {max: countAll, value: countDone});
Object.assign(progressBar.style, {"width":"100%", "height":"10px"});

const progressText = containerEl.createEl('div');
Object.assign(progressText, {
        'textContent': `${getProgress(countDone, countAll)}% ${countDone}/${countAll}`,
});

dv.paragraph(containerEl)
