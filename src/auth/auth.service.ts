import { Injectable } from '@nestjs/common';
import { CognitoIdentityServiceProvider, SES } from 'aws-sdk';
import generateRandomPassword from './generateRandomPassword';

@Injectable()
export class AuthService {
  private cognitoIdentityServiceProvider: CognitoIdentityServiceProvider;
  private ses: SES;
  private readonly userPoolId: string;
  private readonly senderEmail: string;
  private readonly cloudFrontUrl: string;

  constructor() {
    this.cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
      region: process.env.AWS_MY_REGION,
    });
    this.ses = new SES({
      region: process.env.AWS_MY_REGION,
    });
    this.userPoolId = process.env.AWS_COGNITO_USER_POOL_ID_DEV;
    this.senderEmail = process.env.SENDER_EMAIL;
    this.cloudFrontUrl = process.env.CLOUDFRONT_URL;
  }

  private async sendEmail(email: string, temporaryPassword: string) {
    const params = {
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Body: {
          Text: { Data: `Your temporary password is ${temporaryPassword}` },
        },
        Subject: { Data: 'Your Temporary Password' },
      },
      Source: this.senderEmail,
    };

    return this.ses.sendEmail(params).promise();
  }

  async register(email: string): Promise<string> {
    const temporaryPassword = generateRandomPassword();

    const params = {
      UserPoolId: this.userPoolId,
      Username: email,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
        {
          Name: 'picture',
          Value: `${this.cloudFrontUrl}/Profile.png`,
        },
      ],
      DesiredDeliveryMediums: ['EMAIL'],
      MessageAction: 'SUPPRESS',
      TemporaryPassword: temporaryPassword,
    };

    try {
      const createUserResponse = await this.cognitoIdentityServiceProvider
        .adminCreateUser(params)
        .promise();

      await this.cognitoIdentityServiceProvider
        .adminAddUserToGroup({
          UserPoolId: this.userPoolId,
          Username: email,
          GroupName: 'user',
        })
        .promise();

      await this.cognitoIdentityServiceProvider
        .adminUpdateUserAttributes({
          UserPoolId: this.userPoolId,
          Username: email,
          UserAttributes: [
            {
              Name: 'email_verified',
              Value: 'true',
            },
          ],
        })
        .promise();

      await this.sendEmail(email, temporaryPassword);

      return `User ${createUserResponse.User.Username} has been created, added to 'user' group, and email confirmed.`;
    } catch (err) {
      throw new Error(`An error occurred: ${err.message}`);
    }
  }
  async resetPassword(email: string): Promise<string> {
    try {
      const userExist = this.cognitoIdentityServiceProvider.adminGetUser({
        UserPoolId: this.userPoolId,
        Username: email,
      });

      if (userExist) {
        const temporaryPassword = generateRandomPassword();
        await this.cognitoIdentityServiceProvider
          .adminSetUserPassword({
            UserPoolId: this.userPoolId,
            Username: email,
            Password: temporaryPassword,
            Permanent: false,
          })
          .promise();
        await this.sendEmail(email, temporaryPassword);
        return `New password sent to the email ${email}`;
      }
    } catch (err) {
      throw new Error(`An error occurred: ${err.message}`);
    }
  }
}
