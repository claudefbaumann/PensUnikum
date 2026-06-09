# GitHub Actions Workflows — Setup-Anleitung

> Der API-Token hat keinen `workflow`-Scope. Bitte diese 3 Workflows manuell anlegen.
> **Dauer: ca. 5 Minuten.**

---

## Setup in 3 Schritten

### Schritt 1: API Key als Secret hinterlegen
1. → [github.com/claudefbaumann/PensUnikum/settings/secrets/actions](https://github.com/claudefbaumann/PensUnikum/settings/secrets/actions)
2. «New repository secret»
3. Name: `ANTHROPIC_API_KEY`
4. Value: Key aus [console.anthropic.com](https://console.anthropic.com)

---

### Schritt 2: 3 Workflow-Files anlegen

Gehe zu → **Actions** → **New workflow** → **set up a workflow yourself**

---

## Workflow 1: Claude Agent (`claude-agent.yml`)

**Dateiname:** `.github/workflows/claude-agent.yml`

**Wann:** Wenn du `@claude` in einen Issue-Kommentar schreibst
**Modell:** Claude Sonnet 4.5 (~$0.003/Aufgabe)

```yaml
name: Claude Agent (@claude Trigger)

on:
  issue_comment:
    types: [created]
  issues:
    types: [opened]

permissions:
  contents: write
  pull-requests: write
  issues: write

jobs:
  claude-agent:
    runs-on: ubuntu-latest
    if: >-
      contains(github.event.comment.body, '@claude') ||
      contains(github.event.issue.body, '@claude')
    steps:
      - uses: actions/checkout@v4

      - name: Run Claude Agent
        uses: anthropics/claude-code-action@beta
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          model: claude-sonnet-4-5
          max_tokens: 8096
          allowed_tools: "Edit,Write,Bash"
          custom_instructions: |
            Du bist Developer-Agent fuer PensUnikum.
            PFLICHT vor jeder Aufgabe: Lies AGENTS.md, docs/REQUIREMENTS.md,
            docs/ARCHITECTURE.md und docs/OPEN_ISSUES.md.
            Nach der Aufgabe: Update docs/OPEN_ISSUES.md und schreibe
            einen Eintrag in journal/YYYY-MM-DD.md.
```

---

## Workflow 2: Auto Code-Review (`auto-review.yml`)

**Dateiname:** `.github/workflows/auto-review.yml`

**Wann:** Bei jedem Push auf `main` der `app.html` ändert
**Modell:** Claude Haiku 4.5 (~$0.0001/Review)

```yaml
name: Code Review (Push auf main)

on:
  push:
    branches: [main]
    paths: ['app.html']

permissions:
  contents: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Diff erstellen
        id: diff
        run: |
          git diff HEAD~1 HEAD -- app.html > /tmp/diff.txt
          echo "size=$(wc -c < /tmp/diff.txt)" >> $GITHUB_OUTPUT

      - name: Review via Claude Haiku
        if: steps.diff.outputs.size > 100
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          pip install anthropic -q
          python3 -c "
          import anthropic,os,datetime
          diff=open('/tmp/diff.txt').read()[:5000]
          today=datetime.date.today().isoformat()
          client=anthropic.Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])
          r=client.messages.create(model='claude-haiku-4-5',max_tokens=600,
            messages=[{'role':'user','content':f'Code-Review PensUnikum (Deutsch, max 200 Woerter, Markdown):
{diff}'}])
          review=r.content[0].text
          path=f'journal/{today}.md'
          entry=f'

## Auto Code-Review
{review}
'
          try: open(path,'a').write(entry)
          except: open(path,'w').write(f'# Journal {today}{entry}')
          print('Review ->',path)
          "

      - name: Commit Journal
        run: |
          git config user.name "Review Bot"
          git config user.email "bot@pensunikum.ch"
          git add journal/
          git diff --staged --quiet || git commit -m "review: auto Code-Review nach Push"
          git push
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Workflow 3: Tagesjournal (`daily-journal.yml`)

**Dateiname:** `.github/workflows/daily-journal.yml`

**Wann:** Täglich um 20:00 Uhr CEST (automatisch)
**Modell:** Claude Haiku 4.5 (~$0.0001/Tag = ~$0.003/Monat)

```yaml
name: Tagesjournal (20:00 Uhr CEST)

on:
  schedule:
    - cron: '0 18 * * *'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  journal:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Commits des Tages
        run: |
          TODAY=$(date +%Y-%m-%d)
          git log --since="${TODAY} 00:00:00" --until="${TODAY} 23:59:59" \
            --pretty=format:"%h %s (%an)" > /tmp/commits.txt || true
          echo "TODAY=$TODAY" >> $GITHUB_ENV

      - name: Journal via Claude Haiku
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          pip install anthropic -q
          python3 -c "
          import anthropic,os
          commits=open('/tmp/commits.txt').read().strip() or 'Keine Commits heute.'
          today=os.environ['TODAY']
          client=anthropic.Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])
          r=client.messages.create(model='claude-haiku-4-5',max_tokens=400,
            messages=[{'role':'user','content':f'Tagesabschluss PensUnikum (Deutsch, max 150 Woerter, Markdown):
Commits:
{commits}'}])
          entry=f'

## Tagesabschluss (automatisch)
{r.content[0].text}
'
          path=f'journal/{today}.md'
          try:
            txt=open(path).read()
            if '## Tagesabschluss' not in txt: open(path,'a').write(entry)
          except: open(path,'w').write(f'# Journal {today}{entry}')
          print('Journal ->',path)
          "

      - name: Commit Journal
        run: |
          git config user.name "Journal Bot"
          git config user.email "bot@pensunikum.ch"
          git add journal/
          git diff --staged --quiet || git commit -m "journal: Tagesabschluss $TODAY"
          git push
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Kostenschätzung

| Workflow | Frequenz | Modell | Kosten/Monat |
|---|---|---|---|
| Claude Agent | ~5x (manuell) | Haiku 4.5 | ~$0.02 |
| Auto Review | ~20x (bei Push) | Haiku 4.5 | ~$0.02 |
| Tagesjournal | 30x (täglich) | Haiku 4.5 | ~$0.003 |
| **Total** | | | **~$0.05/Mt.** |

---

## Verwendung nach Setup

Neues Issue erstellen und schreiben:
```
@claude Implementiere einen PDF-Export Button für den Stundenplan.
Nutze die Anforderung SP-04 aus docs/REQUIREMENTS.md.
```
→ Claude liest die MD-Files, implementiert das Feature, öffnet einen Pull Request.
