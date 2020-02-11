import { hasSudo } from "@certin/utils";

QUnit.module("hasSudo", hooks => {
  QUnit.test("sudo is present", assert => {
    assert.ok(
      hasSudo(() => true),
      "sudo is found to be present"
    );
  });

  QUnit.test("sudo is absent", assert => {
    assert.equal(
      hasSudo(() => {
        throw new Error("sudo: a password is required");
      }),
      false,
      "sudo is found to be absent"
    );
  });
  QUnit.test("unexpected error still is raised", assert => {
    assert.throws(
      () => {
        hasSudo(() => {
          throw new Error("need a password, yo");
        });
      },
      /Unexpected error while trying to detect sudo elevation: Error: need a password, yo/g,
      "sudo is found to be present"
    );
  });
});
