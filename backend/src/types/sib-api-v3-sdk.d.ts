declare module 'sib-api-v3-sdk' {
  export class ApiClient {
    static instance: any;
    authentications: any;
  }

  export class TransactionalEmailsApi {
    sendTransacEmail(emailData: any): Promise<any>;
  }

  const _default: any;
  export default _default;
}
