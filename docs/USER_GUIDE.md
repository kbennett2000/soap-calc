# User guide

How to use the soap calculator day-to-day. This guide is organized by
feature — skim the table of contents and jump to the part you need.

- [The basics](#the-basics)
- [Calculating a batch from lard](#calculating-a-batch-from-lard)
- [Calculating a batch from any other ingredient](#calculating-a-batch-from-any-other-ingredient)
- [Heavy vs. Light essential oil](#heavy-vs-light-essential-oil)
- [Grams or ounces](#grams-or-ounces)
- [Saving and loading recipes](#saving-and-loading-recipes)
- [Measuring mode](#measuring-mode)
- [Printing a recipe](#printing-a-recipe)
- [Adjusting the factors](#adjusting-the-factors)
- [Soap log (batches)](#soap-log-batches)
- [Tips for kitchen use](#tips-for-kitchen-use)

---

## The basics

The calculator works from ratios. Soap recipes are usually written as
"for every X grams of lard, use Y grams of coconut oil, Z grams of lye,"
and so on. Those ratios are built into the app — the defaults come from
the original spreadsheet the app was built to replace.

To calculate a batch, you type the weight of any **one** ingredient. The
app fills in everything else based on the ratios.

The ingredient you type into is called the **anchor** — it's the one
number that drives the calculation. Every other ingredient is computed
from the anchor. You can always tell which field is the anchor because it
has a highlighted blue border and a small ⚓ icon next to its name.

You can switch the anchor at any time by typing into a different field.
The whole recipe rescales from whatever you most recently typed.

![Main view with Lard anchored at 410g](images/main-view-desktop.png)

In the image above, **Lard** is the anchor (note the ⚓ and the blue border
on the 410.00 input). All the other weights — Coconut Oil at 103.00 g,
Lye at 71.00 g, and so on — are calculated from that anchor value.

---

## Calculating a batch from lard

This is the most common workflow, because lard is the recipe's natural
base ingredient.

1. Open the calculator (it's already loaded if you're using it).
2. Click one of the **Lard presets** at the top: `205 g`, `410 g`,
   `615 g`, `820 g`, `1025 g`, or `1230 g`. These are common batch
   sizes from the original spreadsheet.
3. Lard becomes the anchor and the rest of the ingredients fill in.

The **Total** row at the bottom shows the total weight of the finished
batch — useful for checking it'll fit in your mold.

If you want a lard weight the presets don't cover (say, 500 g), click
into the Lard field and type the number directly. The rest of the recipe
calculates the same way.

---

## Calculating a batch from any other ingredient

You're not stuck with lard as the anchor. Any field, including the
Total row, can drive the calculation.

**Example: you have a leftover jar of coconut oil and want to use up
200 g of it.** Click into the Coconut Oil field, clear what's there,
type `200`, and the whole recipe rescales — telling you exactly how
much lard, lye, water, and essential oil to add to match.

**Example: you have a mold that holds 1000 g of finished soap and you
want to fill it exactly.** Click into the Total field, type `1000`, and
the app gives you the breakdown.

![Main view with Total anchored at 1000g](images/main-view-anchor-total.png)

In the image above, **Total** is the anchor (1000 g), and the app has
worked backwards to tell you that means about 509.95 g of lard, 128.11 g
of coconut oil, and so on.

---

## Heavy vs. Light essential oil

The recipe supports two different essential oil amounts. **Heavy** uses
more essential oil per batch — a stronger scent. **Light** uses less — a
subtler scent. Switch between them with the toggle near the top of the
screen.

When you switch, only the essential oil weight changes. The other
ingredients stay the same.

![Light essential oil selected — note the smaller EO weight](images/main-view-eo-light.png)

In the image above, the same 410 g lard batch shows **Essential Oil**
at 15.00 g (Light) instead of 25.00 g (Heavy).

**One gotcha:** if Essential Oil is currently the anchor (you typed into
the EO field directly), switching Heavy ↔ Light will rescale the entire
batch, because the EO amount you typed is now interpreted against a
different ratio. This is mathematically correct, but it's worth being
aware of — if you'd rather not have the whole batch change, switch the
anchor back to lard first.

---

## Grams or ounces

The **g / oz** toggle changes how the weights are displayed. It does not
change the recipe itself. You can switch back and forth freely.

![Same recipe displayed in ounces](images/main-view-oz.png)

The same 410 g lard batch shown above renders as 14.46 oz of lard, 3.63 oz
of coconut oil, and so on.

Saved recipes are always stored internally in grams, so loading a saved
recipe always produces the same batch regardless of which unit you happen
to have selected at the moment.

---

## Saving and loading recipes

You can save batches you make often. Recipes are stored on the server,
so any device on your network can save or load them — save on your
laptop, load on your phone while you're at the workbench.

### Saving a recipe

1. Set up the recipe (preset, manual input, whatever).
2. Click **Save Recipe**.
3. Type a name (required). Notes are optional, and there's room for
   a short description like "rosemary and mint, doubled" or "Christmas
   gift batch."
4. Click **Save**.

![Save modal with a name and notes filled in](images/save-modal.png)

### Loading a recipe

1. Click **Load Recipe**.
2. The list shows your saved recipes, most recent first, with their
   save date and the first line of any notes.
3. Click **Load** on the one you want. The calculator switches to that
   recipe — including the right Heavy/Light setting — and closes the
   modal.

![Load modal with several saved recipes](images/load-modal-desktop.png)

On a phone, the same modal fills the screen for easier thumb-tapping:

![Load modal on a phone-width browser](images/load-modal-phone.png)

### Renaming a recipe

In the Load modal, click **Rename** on the recipe you want to change.
The name becomes an editable field. Type the new name and click **Save**,
or press Escape to cancel.

### Deleting a recipe

In the Load modal, click **Delete** on the recipe you want to remove.
The browser asks you to confirm — click OK to delete, Cancel to keep it.

---

## Measuring mode

When you're standing at the workbench with the scale in front of you,
typing into input fields is a fast way to bump a recipe by accident.
Measuring mode locks the recipe so you can't change it, and shows
tappable checkboxes you can use to mark off each ingredient as you weigh
it.

### Using measuring mode

1. Load or calculate the recipe you want to make.
2. Click **Start measuring**. The input fields lock, the preset buttons
   disappear, and a checkbox column appears on the left side of the
   ingredients table.
3. Weigh each ingredient on your scale, tapping its checkbox as you go.
   The row strikes through to confirm.
4. When you're done, click **Done**. The checkboxes clear and the
   recipe goes back to normal.

![Measuring mode at phone width, two ingredients checked off](images/measuring-mode-phone.png)

### What clears the checkboxes

The checkboxes are deliberately not saved. They clear when:

- You click **Done**.
- You click **Reset** (clears all checkboxes but stays in measuring mode).
- You refresh the page.
- You load a different recipe.
- The factors change (rare — only happens if someone edits Settings on
  another device while you're measuring).

This is intentional. A measuring session is short, and you don't want
yesterday's half-completed checkboxes to show up the next time you start
a batch.

### What stays the same

- The **g / oz** toggle still works in measuring mode. The recipe doesn't
  change; only the display does.
- You can switch tabs or close the browser briefly and come back.
  Measuring state lives in the browser, so as long as you don't refresh
  the page, it survives.

---

## Printing a recipe

If you'd rather have a paper copy at the workbench than a phone, you can
print the current recipe. The printout is a clean one-page sheet with an
empty checkbox column for ticking off ingredients in pen.

### How to print

1. Make sure the recipe you want is currently displayed.
2. Click **Print**.
3. Your browser's print dialog opens. Choose your printer, or save it as
   a PDF, and print.

![Print preview showing the printout layout](images/print-preview.png)

The printout includes the recipe name (or "Soap Recipe" if you haven't
saved it), the date you printed it, the Heavy or Light selection, the
full ingredients table, and a blank Notes section at the bottom for
handwritten observations.

---

## Adjusting the factors

A **factor** is the ratio that tells the calculator how much of an
ingredient to use per gram of lard. For example, the default coconut
oil factor is about 0.25, meaning "for every 1 g of lard, use 0.25 g of
coconut oil."

The defaults come from the original soap-making spreadsheet. You can
edit them in Settings if your own recipe uses different ratios.

### How to use Settings

1. Click the **⚙ Settings** link at the top right.
2. Edit any of the factors. Lard is locked at 1.0, because it's the
   reference everything else is measured against. Both the **Heavy** and
   **Light** essential oil factors can be edited independently.
3. You can also change the default unit (g or oz) and the default
   Heavy/Light selection — these are what new browser sessions start with.
4. Click **Save**.

![Settings page with factor inputs](images/settings-page.png)

> **Heads up:** changing a factor changes the calculation for every
> recipe, including saved ones. If you load an old recipe after editing
> factors, the ingredient weights will be computed with the new factors,
> not the originals. If you want to experiment, jot down the old values
> first, or use **Reset to defaults** to restore them.

If you change your mind and want the originals back, the **Reset to
defaults** button in Settings restores every factor to the values from
the source spreadsheet.

---

## Soap log (batches)

The calculator can also keep a log of every batch you actually make —
when you made it, what went into it, your notes, and where it is in
its cure cycle.

### What batches are

A **recipe** is a template — "here are the ratios I use for my standard
batch." Recipes live forever and you reuse them every time you make
soap.

A **batch** is a historical record — "on May 15th I actually made a
batch of this soap." Each batch records the date you made it, the
ingredients and amounts that went in, any notes you wanted to remember,
and tracks the cure cycle from when you made it until it's ready to
use.

You don't have to use batches at all if you only need the calculator.
But if you make soap more than occasionally, they're how you remember
which batch was which six weeks later, and which ones are ready to cut
and use.

### The Batches tab

The app has two tabs at the top: **Calculator** (the original) and
**Batches** (the soap log). Click either to switch.

Tab state is preserved as you switch — if you're mid-calculation on the
Calculator and click over to Batches to check on something, your
calculator inputs are still there when you come back.

![Batches tab in dashboard view](images/batches-dashboard-desktop.png)

### Maturity at a glance

Soap needs time after you make it to fully cure. The default is **5
weeks (35 days)**, but you can adjust that — globally in Settings, or
per individual batch.

Each batch shows where it is in its cure cycle:

- A **progress bar** fills from "just made" to "fully cured."
- A **colored status badge** tells you where it is at a glance.

There are three statuses:

- **Curing** (blue) — still in progress. The badge shows how many days
  it's been: "Curing • 18 days."
- **Ready!** (green) — fully cured, within two weeks of its ready date.
  The badge says how long it's been ready: "Ready! • 3 days ago."
- **Mature** (soft gray-green) — fully cured for more than two weeks.
  Still ready to use, but recedes visually so newly-ready batches
  stand out.

The dashboard view above shows all three at a glance: a curing batch
fading in from the top, a couple of ready batches in the middle, and
mature batches at the bottom.

### Starting a batch from a recipe

The most common workflow. When you've just made a batch from a recipe,
record it like this:

1. Load (or calculate) the recipe in the Calculator tab.
2. Click **Start a batch** in the recipe-actions row (next to Save
   Recipe, Load Recipe, and Print).
3. Give it a name — defaults to the recipe's name, or to "Batch made
   [date]" if no recipe is loaded. Edit it however you like.
4. Confirm the date made (defaults to today, but you can backdate).
5. Add notes if you want — anything you'd like to remember about this
   specific batch: which essential oil supplier you used, which mold,
   how the trace behaved.
6. Click **Start batch**.

![Start a batch modal with recipe ingredients listed](images/start-a-batch-modal.png)

The ingredients section in the modal shows exactly what will be
recorded — a snapshot of the current calculator state in grams. This
becomes the batch's permanent ingredient record.

> **Advanced — overriding the cure time.** Most batches use the default
> 35-day cure time. If you've made one that needs longer (a high-coconut
> batch, say), expand the **Advanced** section and check **Override
> cure time**, then type the number of days. This batch alone will use
> the override; the global default is unchanged.

### Recording a historical batch

The second workflow. Use this for batches you made before installing
the app, or any batch made off-recipe (mixed by feel, made from a
recipe outside this app, etc.).

1. Go to the **Batches** tab.
2. Click **+ New batch**.
3. Type a name and the date you actually made it — can be any past
   date.
4. Add ingredients one at a time using **+ Add ingredient**, or leave
   the section empty if you don't remember (or don't have) the
   details. Weights can be left blank too.
5. Add notes. Click **Save batch**.

![New batch modal with two ingredients added](images/new-batch-modal-with-ingredients.png)

It's fine to have batches with no ingredients recorded at all — they
show "(no ingredients recorded)" in the list and that's that. The
date, name, and notes are usually what you actually want to remember.

### Viewing and editing a batch

Click any batch in the list to open its detail view.

![Batch detail view for a Ready batch](images/batch-detail-ready.png)

**What's editable on an existing batch:**

- The **name** — click it to edit in place, press Enter or click
  outside to save
- The **notes** — edit in the textarea, autosaves when you click
  outside
- The **cure-time override** — click Edit next to the cure-time line

**What's locked:**

- The **date you made it**
- The **list of ingredients and amounts**

These are historical facts. Allowing edits would silently rewrite what
you actually did on a specific day and quietly change maturity
calculations. If you got the date or ingredients wrong when saving,
the fix is to delete this batch and create a new one with the correct
information.

The **Delete batch** button is at the bottom of the detail view in
red, with a confirmation prompt before it actually deletes.

### Switching between Dashboard and Table views

Above the batch list there's a **Dashboard / Table** toggle:

- **Dashboard** — cards with prominent progress bars and status
  badges, sorted by most recent first. Best for seeing what needs
  attention at a glance.
- **Table** — traditional sortable rows. Best for scanning a lot of
  batches quickly or sorting by name or status.

Your choice persists per device. If you prefer Table on your laptop
and Dashboard on your phone, that works.

### Searching and filtering

The Batches tab has a search bar at the top. It searches across batch
names, ingredient names, and notes simultaneously — so a search for
**lavender** matches batches named Lavender Spring 2026, batches with
"Bulgarian lavender EO" as an ingredient, and batches whose notes
mention lavender.

Below the search, click **Filters** to expand a panel with three
filter types:

- **Date range** — from/to dates to narrow by when you made batches.
  Either bound can be left empty for open-ended.
- **Status** — checkboxes for Curing, Ready, and Mature. Pick any
  combination. Checking all three or none both mean "no status
  filter."
- **Ingredient** — substring match against ingredient names.

![Filters expanded with two filters active](images/batches-filters-expanded.png)

Filters combine with the search using AND. A search for "rosemary"
with the Curing filter checked shows only currently-curing batches
that have rosemary in the name, ingredients, or notes.

When filters are active, you'll see a count next to the Filters label
even from the collapsed view — for example **▸ Filters (2)** — so you
always know when filtering is hiding things. A **Clear filters** link
resets the filters without clearing the search; an extra Clear filters
in the filtered-empty state ("No batches match your filters") resets
both.

### Tips for tracking batches

- **Save a batch right after you make it** while the details are
  fresh. You can always come back and add cure observations to the
  notes later.
- **Use notes for things you'd otherwise forget**: the lavender
  supplier, that this was the batch where you used 90% lard for once,
  that this batch was meant for the holidays.
- **The dashboard status badge is the fastest way** to see what's
  ready to use without opening anything.
- **For batches from before you had this app**, just enter them as
  historical. Partial ingredient info is fine — no ingredients at all
  is fine. Name, date, and notes are usually what matters.

---

## Tips for kitchen use

A few practical notes from real-world use:

- **Bookmark the URL on your phone.** Typing `http://192.168.1.42:8030`
  every time gets old. A bookmark on the home screen is one tap.
- **Save common batch sizes.** If you always make the 1230 g lard batch
  with the Light setting, save it once with a name like "Big batch
  light" and you can load it with one tap instead of clicking through
  the preset + toggle every time.
- **Use measuring mode at the counter.** It costs nothing and prevents
  bumping an input field with a soapy elbow.
- **Print a copy if your phone isn't convenient.** Some workbenches don't
  have a good place to prop a phone. A printed sheet doesn't care about
  glare or wet hands.
