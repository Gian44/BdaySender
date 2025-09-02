import pandas as pd
from datetime import datetime
import requests


def send_message(recipient_id, access_token, message):
    url = f"https://graph.facebook.com/v17.0/{recipient_id}/messages"
    params = {
        'access_token': access_token,
        'messaging_type': 'UPDATE',
        'message': {
            'text': message
        }
    }

    response = requests.post(url, json=params)
    if response.status_code == 200:
        print("Message sent successfully!")
    else:
        print(f"Failed to send message. Error: {response.text}")


def send_bday_messages(bday_file, page_access_token):
    bdays_df = pd.read_excel(bday_file)
    today = datetime.now().strftime('%m-%d')
    year_now = datetime.now().strftime('%Y')

    for _, item in bdays_df.iterrows():
        bday_str = item['BIRTHDAY (Month DD, YYYY)']
        bday = datetime.strptime(bday_str, '%B %d, %Y').strftime('%m-%d')
        if today == bday and year_now not in str(item['Last Sent']):
            recipient_id = item['Messenger User ID']
            message = 'Happy Birthday ' + str(item['NAME']) + '!!'
            send_message(recipient_id, page_access_token, message)

            # Update the 'Last Sent' column
            bdays_df.loc[_, 'Last Sent'] = year_now

    bdays_df.to_excel(bday_file, index=False)


if __name__ == '__main__':
    # Provide the path to your Bday.xlsx file and the Facebook Page Access Token
    send_bday_messages(bday_file='Bday.xlsx', page_access_token='')
