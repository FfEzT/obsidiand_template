function dice(page) {
    let dur = (
                page.ff_deadline
                ? page.ff_deadline.diffNow()
                : dv.duration("14d")
        ).as("hour")
    dur = Math.max(dur, 1) || 1

    let ff_impact = page.ff_impact || 0.25
    let ff_confidence = page.ff_confidence || 30

    let effort = null
    if (page.ff_duration) {
        effort = page.ff_duration.as("hours")
    }
    else if (page.ff_deadline) {
        effort = dv.duration("1h30m").as("hours")

        if (!page.ff_impact) {
            ff_impact = 1
        }
    }
    else {
        return null
    }

    // NOTE, чтобы из-за effort оценка задачи не сильно падала
    effort = Math.pow(effort, 0.4)

    let result = ff_impact * ff_confidence /
        effort / dur
    result *= 100

    return Math.floor(result * 1000) / 1000
}


const currentDv = dv.current()
let pages = dv.pages()
.where(
	page => page.file.path.startsWith(currentDv.file.folder)
	&& page.ff_status
	&& !page.ff_status?.contains("done")
	&& page.ff_status != "🔵in progress"
)
.sort(p => p.ff_status)
.sort(p => p.ff_deadline)
.sort(p => p.ff_impact)
.sort(p => p.ff_confidence)
.array()

let result = []

// ff_status, ff_l_parent, replace(progress, "current()", PROG) AS progress
for (let page of pages) {
	if (page.ff_frequency)
		continue

	const _dice = dice(page)
	if (_dice)
		result.push(
			[
				page.file.link,
				page.ff_status,
				page.ff_date,
				page.ff_duration,
				_dice,
				page.ff_deadline,
				page.ff_impact,
				page.ff_confidence,
			]
		)
}

result = result.filter(p => !p[2])
	//.filter(p => p[4])
	.sort(
		(a, b) => {
			return a[4] <= b[4]? 1:-1
		}
	)

dv.table(
	["File", "ff_status", "ff_date", "ff_duration", "dice", "ff_deadline", "ff_impact", "ff_confidence"],
	result
)
