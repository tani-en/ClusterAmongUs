const TASK_STEPS = 5;
const TASK_ID = "books"; // GameManager.js の TASK_DEFS の id

const BOOKSTAND    = [$.worldItemReference("bookStandRed"), $.worldItemReference("bookStandBlue"), $.worldItemReference("bookStandGreen")];
const BOOKTEMPLATE = [new WorldItemTemplateId("book_red"), new WorldItemTemplateId("book_blue"), new WorldItemTemplateId("book_green")];


$.onStart(() => {
  $.state.Books     = [];
  $.state.stateTask = {};
});


$.onInteract(() => {

  let Books =  $.state.Books.filter(book => book.exists());
  if (Books.length < TASK_STEPS){
    const markerPosition = $.getPosition();
    markerPosition.y += 3;

    const markerRotation = $.getRotation();

    let color = Math.floor(Math.random() * 3);

    const worldItemTemplateId = BOOKTEMPLATE[color];
    const bookStand = BOOKSTAND[color];

    const bookHandle = $.createItem(worldItemTemplateId, markerPosition, markerRotation);
    Books.push(bookHandle);
    bookHandle.send("bookStand", bookStand);
    $.state.Books = Books;
  }

});


$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "deleteBook":
      let Books = $.state.Books;
      if (!Books.some(book => book.id === sender.id)) break;
      Books = Books.filter(book => book.id != sender.id);
      $.state.Books = Books;
      if (arg && arg.player) taskProgress(arg.player); 
      break;
    
    case "start":
      $.state.Books.forEach(book => {
        book.send("start", null);
      });
      $.state.Books     = [];
      $.state.stateTask = {};
      break;

  }
});


function taskProgress(player){
  let stateTask = $.state.stateTask;

  if (player.id in stateTask) {
    stateTask[player.id] += 1; 
  } else {
    stateTask[player.id] = 1;
  }
  $.state.stateTask = stateTask;

  if (stateTask[player.id] === TASK_STEPS){
    $.worldItemReference("gameManager").send("taskStep", {
      taskId: TASK_ID,
      player: player
    });
  }
}