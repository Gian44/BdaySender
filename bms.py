import pandas as pd
from datetime import datetime
import smtplib
from email.message import EmailMessage
import time

def read_message_from_file(file_path):
    with open(file_path, 'r', encoding='unicode_escape') as file:
        message = file.read()
    return message

def send_email(recipient, subject, msg):
    GMAIL_ID = 'renomerong4@gmail.com'
    GMAIL_PWD = 'potwfqdbxszzxfpl'

    email = EmailMessage()
    email['Subject'] = subject
    email['From'] = GMAIL_ID
    email['To'] = recipient
    email.set_content(msg)

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as gmail_obj:
        gmail_obj.ehlo()
        gmail_obj.login(GMAIL_ID, GMAIL_PWD)
        gmail_obj.send_message(email)

def send_bday_emails(bday_file):
    running = True  # Flag variable to control the loop
    task_completed_condition = False

    birthday_message = read_message_from_file('birthday_message.txt')
    belated_birthday_message = read_message_from_file('belated_birthday_message.txt')

    while running:
        bdays_df = pd.read_excel(bday_file)
        today = datetime.now().date()
        year_now = datetime.now().strftime('%Y')
        sent_index = []

        for idx, item in bdays_df.iterrows():
            bday_date = item['BIRTHDAY (Month DD, YYYY)'].date()
            if bday_date.day == today.day and bday_date.month == today.month:
                if year_now not in str(item['Last Sent']):
                    msg = birthday_message.format(NICKNAME=item['NICKNAME'])
                    send_email(item['PERSONAL EMAIL (not UP mail)'], 'Happy Birthday', msg)
                    sent_index.append(idx)
                    print("Greetings sent to " + str(item['NAME']))
            elif bday_date.month < today.month or (bday_date.month == today.month and bday_date.day < today.day):
                if year_now not in str(item['Last Sent']):
                    msg = belated_birthday_message.format(NICKNAME=item['NICKNAME'])
                    send_email(item['PERSONAL EMAIL (not UP mail)'], 'Belated Happy Birthday', msg)
                    sent_index.append(idx)
                    print("Belated greetings sent to " + str(item['NAME']))
                else:
                    sent_index.append(idx)

        for idx in sent_index:
            bdays_df.loc[bdays_df.index[idx], 'Last Sent'] = year_now

        #if item['PERSONAL EMAIL (not UP mail)'] == 'renomerong4@gmail.com':
            #bdays_df.loc[bdays_df.index[idx], 'Last Sent'] = ''

        bdays_df.to_excel(bday_file, index=False)
        task_completed_condition = True

        if task_completed_condition:
            running = False
            print("Task is done!")

        time.sleep(5)

if __name__ == '__main__':
    send_bday_emails(bday_file='Bday.xlsx')
