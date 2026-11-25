// roleCountManager という名前のRoleCountManagerに接続する。
$.onInteract(() => {
  $.worldItemReference("roleCountManager").send("Change", -1);
});
