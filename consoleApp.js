const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const readlineSync = require('readline-sync');

const dataFilePath = path.join(__dirname, 'data.json');
let appointments = loadAppointments();

function loadAppointments() {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading data from file:', error.message);
    return [];
  }
}

function saveAppointments() {
  try {
    const data = JSON.stringify(appointments, null, 2);
    fs.writeFileSync(dataFilePath, data, 'utf8');
  } catch (error) {
    console.error('Error saving data to file:', error.message);
  }
}
function getOperatorAppointments(operatorId) {
    const operatorAppointments = appointments.filter(appointment => appointment.operatorId === operatorId);
    return operatorAppointments;
}
function getAvailableSlots(operatorId) {
  const operatorAppointments = appointments.filter(appointment => appointment.operatorId === operatorId);
  operatorAppointments.sort((a, b) => a.start.localeCompare(b.start));
  const availableSlots = [];
  let currentSlotStart = '00:00';
  for (const appointment of operatorAppointments) {
    if (currentSlotStart !== appointment.start) {
      availableSlots.push({ start: currentSlotStart, end: appointment.start });
    }
    currentSlotStart = appointment.end;
  }
  availableSlots.push({ start: currentSlotStart, end: '24:00' });
  return availableSlots;
}

function bookAppointment(operatorId, start, end) {
  const appointmentId = uuid.v4();
  const newAppointment = { appointmentId, operatorId, start, end };
  appointments.push(newAppointment);
  saveAppointments();
  return newAppointment;
}

function rescheduleAppointment(appointmentId, start, end) {
  const index = appointments.findIndex(appointment => appointment.appointmentId === appointmentId);
  if (index !== -1) {
    appointments[index].start = start;
    appointments[index].end = end;
    saveAppointments();
    return appointments[index];
  } else {
    return { error: 'Appointment not found' };
  }
}

function cancelAppointment(appointmentId) {
  const index = appointments.findIndex(appointment => appointment.appointmentId === appointmentId);
  if (index !== -1) {
    const canceledAppointment = appointments.splice(index, 1)[0];
    saveAppointments();
    return canceledAppointment;
  } else {
    return { error: 'Appointment not found' };
  }
}

function displayMenu() {
  console.log('\n1. Book Appointment');
  console.log('2. View Operator Appointments');
  console.log('3. View Operator Available Slots');
  console.log('4. Reschedule Appointment');
  console.log('5. Cancel Appointment');
  console.log('6. Exit');
}

function main() {
  let choice;

  do {
    displayMenu();
    choice = readlineSync.question('\nEnter your choice: ');

    switch (choice) {
      case '1':
        const operatorId = readlineSync.question('Enter Operator ID: ');
        const start = readlineSync.question('Enter Start Time (HH:mm): ');
        const end = readlineSync.question('Enter End Time (HH:mm): ');
        const bookedAppointment = bookAppointment(operatorId, start, end);
        console.log('\nAppointment booked successfully:');
        console.log(bookedAppointment);
        break;

      case '2':
        const operatorIdForAppointments = readlineSync.question('Enter Operator ID: ');
        const operatorAppointments = getOperatorAppointments(operatorIdForAppointments);
        console.log(`\nAppointments for Operator ${operatorIdForAppointments}:`);
        console.log(operatorAppointments);
        break;

      case '3':
        const operatorIdForSlots = readlineSync.question('Enter Operator ID: ');
        const availableSlots = getAvailableSlots(operatorIdForSlots);
        console.log(`\nAvailable Slots for Operator ${operatorIdForSlots}:`);
        console.log(availableSlots);
        break;

      case '4':
        const appointmentIdToReschedule = readlineSync.question('Enter Appointment ID to Reschedule: ');
        const newStart = readlineSync.question('Enter New Start Time (HH:mm): ');
        const newEnd = readlineSync.question('Enter New End Time (HH:mm): ');
        const rescheduledAppointment = rescheduleAppointment(appointmentIdToReschedule, newStart, newEnd);
        if ('error' in rescheduledAppointment) {
          console.log(`\n${rescheduledAppointment.error}`);
        } else {
          console.log('\nAppointment rescheduled successfully:');
          console.log(rescheduledAppointment);
        }
        break;

      case '5':
        const appointmentIdToCancel = readlineSync.question('Enter Appointment ID to Cancel: ');
        const canceledAppointment = cancelAppointment(appointmentIdToCancel);
        if ('error' in canceledAppointment) {
          console.log(`\n${canceledAppointment.error}`);
        } else {
          console.log('\nAppointment canceled successfully:');
          console.log(canceledAppointment);
        }
        break;

      case '6':
        console.log('\nExiting the program.');
        break;

      default:
        console.log('\nInvalid choice. Please enter a valid option.');
    }
  } while (choice !== '6');
}

main();
