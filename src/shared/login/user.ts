export class User {
  constructor(
    public emails : Email,
    public password   : string
  ) {  }

}
export class Email {
  constructor(
    public email: string,
    public is_primary: boolean
  ){}
}
