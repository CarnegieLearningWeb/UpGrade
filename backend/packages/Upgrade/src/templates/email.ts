export class Emails {

    public header = '';
    public footer = `<br>
    <br>
    UpGrade -LOGO-`;

    public generateEmailText(emailBody: string): string {
        return this.header + emailBody + this.footer;
    }
}
