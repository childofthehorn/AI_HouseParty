---
name: tests-must-call-the-changed-function
description: On PR review, check that new tests actually invoke the changed function, not a look-alike collaborator; bots routinely mis-praise these as end-to-end coverage
metadata:
  type: feedback
---

When reviewing a PR's new tests, verify the test actually calls the function the PR
changed. A frequent shape: the fix lives in a thin wrapper/facade (`Foo.add` forwarding
to `inner.add`), and the test exercises the *inner* collaborator directly with a
hand-built wrapper argument. The test passes even if the wrapper is reverted to the
buggy form. State the regression concretely: "revert line N to the pre-PR form and all
N tests still pass green."

**Why:** Found on a PR that fixed a vendor SDK's identity listener. The tests built a bare
`MulticastListener` and called `MulticastListener.add/remove`, never the wrapper's own
`add` / `remove` actuals that the PR fixed. Both the review bot and the PR body
described this as validating the contract "end-to-end." It didn't. Once that claim is in
the thread, the next reader treats the gap as covered and never writes the real test.

**How to apply:** For any PR whose fix is in a wrapper, adapter, `actual`, or extension
function, grep the test file for the *changed symbol's own name*. If it's absent, that's
a finding. Then check whether the real type is constructible in a host test before
suggesting one — decompile the vendor artifact and read the constructor body
(see [[reference-decompile-vendor-aars-from-gradle-cache]]); a public constructor whose
body is pure field assignment means the "we can't test it" objection doesn't hold.

Related: [[comment-and-test-polish-standard]], [[absence-claims-enumerate]].
