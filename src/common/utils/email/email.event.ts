import { EventEmitter } from 'node:events';
import Mail  from 'nodemailer/lib/mailer';
import { sendEmail } from './../email/send.email';
import { emailTemplate } from './../email/verify.template.email';
import { OtpEnum } from 'src/common/enums/otp.enum';

export interface IEmail extends Mail.Options{
    otp:string;
}
export const emailEvent = new EventEmitter();

emailEvent.on(OtpEnum.confirmEmail, async (data:IEmail) => {
    try {
        data.subject = OtpEnum.confirmEmail;
        data.html = emailTemplate(data.otp, data.subject);
        await sendEmail(data);
    } catch (error) {
        console.log(`failed to send email to ${data.to}`, error);
    }
})

emailEvent.on(OtpEnum.resetPassword, async (data:IEmail) => {
    try {
        data.subject = OtpEnum.resetPassword;
        data.html = emailTemplate(data.otp, data.subject);
        await sendEmail(data);
    } catch (error) {
        console.log(`failed to send email to ${data.to}`, error);
    }
})