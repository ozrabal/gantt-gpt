const taskHeight = 30;
const handlerWidth = 10;
const dragSensitivity = 5;
const paddingLeft = 10;
let animationFrameRequested = false;

document.addEventListener('DOMContentLoaded', () => {
  const taskForm = document.getElementById('taskForm');
  const canvas = document.getElementById('ganttChart');
  const ctx = canvas.getContext('2d');
  const tasks = [
    {
      taskName: 'Task 1',
      startDate: new Date(2023, 3, 1),
      endDate: new Date(2023, 3, 10),
    },
    {
      taskName: 'Task 2',
      startDate: new Date(2023, 3, 5),
      endDate: new Date(2023, 3, 15),
    },
    {
      taskName: 'Task 3',
      startDate: new Date(2023, 3, 10),
      endDate: new Date(2023, 3, 20),
    },
  ];




  drawGanttChart(tasks, ctx);

  let dragging = false;
  let dragTask = null;
  let dragStartX = 0;
  let dragStartTaskStart = 0;

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskName = e.target.taskName.value;
    const startDate = new Date(e.target.startDate.value);
    const endDate = new Date(e.target.endDate.value);

    if (endDate < startDate) {
      alert('End date should be greater than or equal to start date');
      return;
    }

    tasks.push({ taskName, startDate, endDate });
    drawGanttChart(tasks, ctx);
  });

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  tasks.forEach((task, idx) => {
    const taskX = getDateOffset(task.startDate, ctx, tasks);
    const taskY = taskHeight * idx;
    const taskWidth = getDateOffset(task.endDate, ctx, tasks) - taskX;

    if (x >= taskX && x <= taskX + handlerWidth && y >= taskY && y <= taskY + taskHeight) {
      dragging = true;
      dragTask = task;
      dragStartX = x;
      dragStartTaskStart = taskX;
      dragMode = 'start';
    } else if (x >= taskX + taskWidth - handlerWidth && x <= taskX + taskWidth && y >= taskY && y <= taskY + taskHeight) {
      dragging = true;
      dragTask = task;
      dragStartX = x;
      dragStartTaskStart = taskX;
      dragMode = 'end';
    }
  });
  });



  canvas.addEventListener('mousemove', (e) => {
    if (dragging) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const deltaX = x - dragStartX;
  
      const msPerPixel = (tasks[tasks.length - 1].endDate - tasks[0].startDate) / (ctx.canvas.width - 2 * paddingLeft);
      const msDelta = deltaX * msPerPixel;
      const daysDelta = Math.round(msDelta / (1000 * 60 * 60 * 24));
      const msRoundedDelta = daysDelta * 1000 * 60 * 60 * 24;
  
      if (dragMode === 'start') {
        const newStartDate = new Date(dragTask.startDate.getTime() + msRoundedDelta);
        if (newStartDate < dragTask.endDate) {
          dragTask.startDate = newStartDate;
        }
      } else if (dragMode === 'end') {
        const newEndDate = new Date(dragTask.endDate.getTime() + msRoundedDelta);
        if (newEndDate > dragTask.startDate) {
          dragTask.endDate = newEndDate;
        }
      }
  
      if (!animationFrameRequested) {
        animationFrameRequested = true;
        requestAnimationFrame(() => {
          drawGanttChart(tasks, ctx);
          animationFrameRequested = false;
        });
      }
  
      dragStartX = x;
      dragStartTaskStart = getDateOffset(dragTask.startDate, ctx, tasks);
    }
  });
  
  
  canvas.addEventListener('mouseup', () => {
    dragging = false;
    dragTask = null;
  });
  
});

function getDateOffset(date, ctx, tasks) {
  const minDate = tasks.reduce((min, task) => task.startDate < min ? task.startDate : min, tasks[0].startDate);
  const maxDate = tasks.reduce((max, task) => task.endDate > max ? task.endDate : max, tasks[0].endDate);
  const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
  const days = (date - minDate) / (1000 * 60 * 60 * 24);
  const colWidth = ctx.canvas.width / totalDays;
  return days * colWidth;
}

function getDateFromOffset(offset, ctx, tasks) {
  const minDate = tasks.reduce((min, task) => task.startDate < min ? task.startDate : min, tasks[0].startDate);
  const maxDate = tasks.reduce((max, task) => task.endDate > max ? task.endDate : max, tasks[0].endDate);
  const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
  const days = (offset / ctx.canvas.width) * totalDays;
  return new Date(minDate.getTime() + days * 1000 * 60 * 60 * 24);
}



function drawGanttChart(tasks, ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const minDate = tasks.reduce((min, task) => task.startDate < min ? task.startDate : min, tasks[0].startDate);
  const maxDate = tasks.reduce((max, task) => task.endDate > max ? task.endDate : max, tasks[0].endDate);
  const days = (maxDate - minDate) / (1000 * 60 * 60 * 24);

  const rowHeight = ctx.canvas.height / (tasks.length + 1);
  const colWidth = ctx.canvas.width / (days + 1);

  // Draw month and day divisions
  ctx.beginPath();
  ctx.strokeStyle = '#000';
  let currentDate = new Date(minDate);
  currentDate.setDate(currentDate.getDate() - currentDate.getDate() + 1); // Move to the first day of the month
  let x = 0;
  while (currentDate <= maxDate) {
    x = (currentDate - minDate) / (1000 * 60 * 60 * 24) * colWidth;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ctx.canvas.height);
    ctx.fillText(currentDate.toISOString().slice(0, 10), x + 5, 15);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  ctx.stroke();

  tasks.forEach((task, idx) => {
    const taskX = getDateOffset(task.startDate, ctx, tasks);
    const taskY = taskHeight * idx;
    const taskWidth = getDateOffset(task.endDate, ctx, tasks) - taskX;

    ctx.fillStyle = 'blue';
    ctx.fillRect(taskX, taskY, taskWidth, taskHeight);

    ctx.fillStyle = 'red';
    ctx.fillRect(taskX, taskY, handlerWidth, taskHeight);
    ctx.fillRect(taskX + taskWidth - handlerWidth, taskY, handlerWidth, taskHeight);

    ctx.fillStyle = 'black';
    ctx.fillText(task.taskName, taskX + 5, taskY + taskHeight / 2);
  });
}
