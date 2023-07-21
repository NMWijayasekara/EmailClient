document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  //Send the email 
  document.querySelector('#submit').addEventListener('click', () => send_email(event));

  // By default, load the inbox
  load_mailbox('inbox');

});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#reply-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#reply-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //Remove archive button in sent
  if (mailbox == 'sent') {
    document.querySelector('#archive_button').style.display = 'none';
  }
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      console.log(emails)
      //Viewing emails
      for (const i in emails) {
        const sender = emails[i].sender;
        const subject = emails[i].subject;
        const time = emails[i].timestamp;
        const email_div = document.createElement('div');
        email_div.className = 'email'
        if (emails[i].read == true) {
          email_div.style.fontWeight = 1;
          email_div.style.opacity = 0.5
        } else {
          email_div.style.opacity = 1;
          email_div.style.fontWeight = 'bold';
        }
        email_div.innerHTML = `<b>${sender}</b>| ${subject} <small style="float:right;">${time}</small>`
        // View email
        email_div.addEventListener('click', () => view_email(emails[i].id));

        document.querySelector('#emails-view').append(email_div);
      }
    });
}

function send_email(event) {
  event.preventDefault();
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
      archived: false
    })
  })
    .then(response => response.json())
    .then(result => {
      //Display result
      if (result.message) {
        load_mailbox('sent')
        alert(result.message)
      } else {
        compose_email
        const error_message = document.querySelector('#error_message');
        error_message.innerHTML = result.error;
        error_message.style.display = 'block';
        return false;
      }
    });
}

function view_email(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#reply-view').style.display = 'none';
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      document.querySelector('#sender').innerHTML = email.sender;
      document.querySelector('#subject').innerHTML = email.subject;
      document.querySelector('#body').innerHTML = email.body;
      document.querySelector('#time').innerHTML = email.timestamp;
      document.querySelector('#recipients').innerHTML = email.recipients;
      //Archive email
      const archive_email = document.querySelector('#archive_button');
      if (email.archived == true) {
        archive_email.innerHTML = 'Unarchive';
      } else if (email.archived == false) {
        archive_email.innerHTML = 'Archive';
      }
      archive_email.addEventListener('click', () => archive(email.id))
      //Send reply
      document.querySelector('#reply').addEventListener('click', () => reply(email))
    });
}

function reply(email) {
  //View the reply form
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#reply-view').style.display = 'block';

  document.querySelector('#reply-title').innerHTML = `Reply to ${email.subject}`
  document.querySelector('#reply-recipients').value = email.sender;
  document.querySelector('#reply-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`
    //Get reply details
    ;
  let subject_reply = [];
  if (email.subject.startsWith("Re:")) {
    subject_reply[0] = email.subject;
  } else {
    subject_reply[0] = `Re: ${email.subject}`;
  }
  document.querySelector('#reply-subject').value = subject_reply[0];
  document.querySelector('#reply-submit').addEventListener('click', () => {
    const reply_body = document.querySelector('#reply-body').value
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: email.sender,
        subject: subject_reply[0],
        body: reply_body
      })
    })
      .then(response => response.json())
      .then(result => {
        // Display result
        console.log(result);
      });
  })
}

function archive(id) {
  const archive_button = document.querySelector('#archive_button').innerHTML;
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: (archive_button == 'Archive')
    })
  })
    location.reload(true)
}