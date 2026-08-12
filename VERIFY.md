# Claims to verify before this ships as fact

The part copy in `content/ls-v8.ts` is a first draft written from general
mechanical knowledge, not transcribed from a service manual. Most of it is
qualitative and safe. The items below make a **quantitative or interval claim**
and should be checked against a real source first.

Each is flagged in the data with `needsVerify: true`.

---

### 1. Air filter — service interval

> "A scheduled replacement item — inspected at services and changed far sooner
> in dusty conditions."

- **Check:** whether GM's schedule for the relevant LS application actually
  lists the air filter on a fixed interval, and what that interval is.
- **Why it matters:** the copy implies a scheduled item without naming a figure.
  If a real interval exists, name it. If it is condition-based, say so.

### 2. Air filter — air-to-fuel volume claim

> "An engine swallows thousands of litres of air for every litre of fuel it
> burns."

- **Check:** the arithmetic. At a stoichiometric ~14.7:1 by mass, one litre of
  petrol (~750 g) needs ~11 kg of air, which at sea-level density (~1.2 g/L) is
  roughly 9,000 litres.
- **Status:** believed correct, but it is a specific order-of-magnitude claim
  and deserves a second pass before publication.

### 3. Radiator — share of fuel energy rejected as heat

> "Roughly a third of the energy in the fuel leaves the engine as heat through
> this."

- **Check:** the fraction of fuel energy rejected specifically to the **coolant
  circuit**, as opposed to out of the exhaust. Textbook energy balances for a
  spark-ignition engine usually put coolant around 25–30% and exhaust around
  30–35%.
- **Why it matters:** "a third" may be overstating the coolant share slightly.
  Confirm the number, or reword to a range.

### 4. Accessory belt — inspection interval

> "A wear item — inspected at services and replaced when cracked or glazed."

- **Check:** whether a mileage or time interval should be named rather than
  leaving it condition-based.

---

## Not a spec issue, but worth recording

The source model is a single merged casting with no part names, so several
components could not be identified on it with confidence and were **left out
rather than pinned to a plausible-looking lump**:

- alternator
- starter motor
- oil filter
- water pump
- throttle body

If a future module uses a model with named sub-meshes, these should come back.
Labelling the wrong lump in a learning tool is worse than omitting the part.
