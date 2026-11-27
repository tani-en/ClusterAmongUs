// 「誰が誰に投票したか」を、投票が終わってから表示する。GameManager から次のメッセージが届く。
//   "voteStart"     { candidates: [{ id, name }] } 投票が始まった → 候補者を覚えて、記録と表示を空にする
//   "result"        { voterName, targetName, id } 1人が投票した → 記録だけする(まだ表示しない。id は被投票者のid)
//   "meetingFinish" 投票が終わった → 記録を表示し、RESULT_SECONDS 秒たったら消す
const TEXT = $.subNode("TextView"); // 表示するText(subNode の名前に合わせる)
const RESULT_SECONDS = 10;          // 投票終了後、表示しておく秒数

$.onStart(() => {
  $.state.candidates = [];  // [{ id, name }] 投票の候補者
  $.state.votes = [];       // [{ voterName, targetName, id }] 投票した順
  $.state.clearLeft = -1;   // 表示を消すまでの残り秒数(-1: 数えない)
  $.state.show = false;     // 投票結果を表示中か
  render();
});

$.onReceive((messageType, arg) => {
  switch (messageType) {
    case "voteStart":
      $.state.candidates = (arg && arg.candidates) ? arg.candidates : [];
      $.state.votes = [];
      $.state.show = false;
      $.state.clearLeft = -1;
      render();
      break;

    case "meetingFinish":
      $.state.show = true;
      $.state.clearLeft = RESULT_SECONDS;
      render();
      break;

    case "result": { // { voterName, targetName, id }
      if (!arg) break;
      // 同じ人の投票は、新しいもので置き換える
      const votes = $.state.votes.filter(v => v.voterName !== arg.voterName);
      votes.push({ voterName: arg.voterName, targetName: arg.targetName, id: arg.id });
      $.state.votes = votes; // 投票中は記録だけ(表示は meetingFinish で)
      break;
    }
  }
});

$.onUpdate(deltaTime => {
  if ($.state.clearLeft < 0) return;
  $.state.clearLeft -= deltaTime;
  if ($.state.clearLeft <= 0) {
    $.state.clearLeft = -1;
    $.state.votes = [];
    $.state.show = false;
    render();
  }
});

// 被投票者(全員)とスキップを並べて、それぞれに入れた人を出す。
//   投票結果
//   たろう (2票): はなこ, ゆうき
//   はなこ (1票): たろう
//   ゆうき (0票)
//   スキップ (1票): みさき
function render() {
  const votes = $.state.votes;
  let text = "";
  if ($.state.show) {
    const rows = $.state.candidates.map(c => ({ id: c.id, name: c.name }));
    // 候補者の一覧に無い投票先(退室した人など)があれば、その分も出す
    for (const v of votes) {
      if (v.id !== "skip" && !rows.some(r => r.id === v.id)) rows.push({ id: v.id, name: v.targetName });
    }
    rows.push({ id: "skip", name: "スキップ" });

    const lines = rows.map(r => {
      const voters = votes.filter(v => v.id === r.id).map(v => v.voterName);
      return r.name + " (" + voters.length + "票)" + (voters.length > 0 ? ": " + voters.join(", ") : "");
    });
    text = "投票結果\n" + lines.join("\n");
  }
  try { TEXT.setText(text); } catch (e) {}
}