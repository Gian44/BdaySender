import argparse
import os
import smtplib
from datetime import datetime
from email.message import EmailMessage
from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
BIRTHDAY_COL = "BIRTHDAY (Month DD, YYYY)"
EMAIL_COL = "PERSONAL EMAIL (not UP mail)"
NAME_COL = "NAME"
NICKNAME_COL = "NICKNAME"
LAST_SENT_COL = "Last Sent"


def read_message_from_file(file_path: Path) -> str:
    with file_path.open("r", encoding="utf-8") as file:
        return file.read()


def resolve_gmail_credentials() -> tuple[str, str]:
    gmail_id = os.getenv("BDAY_SENDER_GMAIL_ID", "").strip()
    gmail_pwd = os.getenv("BDAY_SENDER_GMAIL_APP_PASSWORD", "").strip()
    if not gmail_id or not gmail_pwd:
        raise ValueError(
            "Missing Gmail credentials. Set BDAY_SENDER_GMAIL_ID and "
            "BDAY_SENDER_GMAIL_APP_PASSWORD environment variables."
        )
    return gmail_id, gmail_pwd


def send_email(
    recipient: str,
    subject: str,
    msg: str,
    gmail_id: str,
    gmail_pwd: str,
    dry_run: bool = False,
) -> None:
    if dry_run:
        print(f"[DRY RUN] Would send '{subject}' to {recipient}")
        return

    email = EmailMessage()
    email["Subject"] = subject
    email["From"] = gmail_id
    email["To"] = recipient
    email.set_content(msg)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as gmail_obj:
        gmail_obj.ehlo()
        gmail_obj.login(gmail_id, gmail_pwd)
        gmail_obj.send_message(email)


def send_bday_emails(bday_file: str, dry_run: bool = False) -> None:
    bdays_df = pd.read_excel(bday_file)
    today = datetime.now().date()
    current_year = str(today.year)
    sent_index: list[int] = []

    birthday_message = read_message_from_file(BASE_DIR / "birthday_message.txt")

    gmail_id = ""
    gmail_pwd = ""
    if not dry_run:
        gmail_id, gmail_pwd = resolve_gmail_credentials()

    for idx, item in bdays_df.iterrows():
        parsed_bday = pd.to_datetime(item.get(BIRTHDAY_COL), errors="coerce")
        if pd.isna(parsed_bday):
            continue

        if current_year in str(item.get(LAST_SENT_COL, "")):
            continue

        recipient = str(item.get(EMAIL_COL, "")).strip()
        if not recipient:
            continue

        nickname = str(item.get(NICKNAME_COL, "")).strip() or str(
            item.get(NAME_COL, "")
        ).strip()
        bday_date = parsed_bday.date()

        if (bday_date.month, bday_date.day) != (today.month, today.day):
            continue

        msg = birthday_message.format(NICKNAME=nickname)
        send_email(recipient, "Happy Birthday", msg, gmail_id, gmail_pwd, dry_run)
        sent_index.append(idx)
        print(f"Greetings sent to {item.get(NAME_COL, nickname)}")

    if dry_run:
        print(f"[DRY RUN] Would update {len(sent_index)} row(s) in '{bday_file}'.")
        return

    if sent_index:
        for idx in sent_index:
            bdays_df.loc[bdays_df.index[idx], LAST_SENT_COL] = current_year
        bdays_df.to_excel(bday_file, index=False)

    print("Task is done!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Send birthday emails from spreadsheet")
    parser.add_argument("--file", default="Bday.xlsx", help="Path to birthday spreadsheet")
    parser.add_argument(
        "--dry-run", action="store_true", help="Preview sends without sending emails"
    )
    args = parser.parse_args()
    send_bday_emails(bday_file=args.file, dry_run=args.dry_run)
