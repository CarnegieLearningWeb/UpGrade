export class Emails {
  public header = '';
  public footer = `<br>
    <br>
    UpGrade -LOGO-`;
  public roleChangeEmailBody(role: string): string {
    const emailBody = `Greetings!,
      <br>
      Your Role in Upgrade is changed to ${role}!
      <br>
      To know more about how UpGrade works, please visit
      <a href="https://www.upgradeplatform.org/"> www.upgradeplatform.org</a>
      . To read the documentation, visit
      <a href="https://upgrade-platform.gitbook.io/upgrade-documentation/"> UpGrade-docs</a>
      <br>`;
    return emailBody;
  }

  public welcomeEmailBody(): string {
    const emailBody = `Greetings!,
        <br>
        A new user account was created for you in UpGrade. You can sign into UpGrade using your Google credentials.
        <br>
        To know more about how UpGrade works, please visit
        <a href="https://www.upgradeplatform.org/"> www.upgradeplatform.org</a>
        . To read the documentation, visit
        <a href="https://upgrade-platform.gitbook.io/upgrade-documentation/"> UpGrade-docs</a>
        <br>`;
    return emailBody;
  }

  public generateEmailText(emailBody: string): string {
    return this.header + emailBody + this.footer;
  }
}
