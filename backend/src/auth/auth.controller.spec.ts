import { AuthController } from './auth.controller';
const u = { id: 'u1', email: 'u@t.com', isAdmin: false };
function build() {
  const auth = {
    register: jest.fn(), login: jest.fn(), logout: jest.fn(), googleAuth: jest.fn(),
    verifyEmail: jest.fn(), forgotPassword: jest.fn(), resetPassword: jest.fn(),
    resendVerification: jest.fn(), me: jest.fn(),
  };
  return { c: new AuthController(auth as never), auth };
}
describe('AuthController (delegación)', () => {
  it('delega el ciclo de autenticación', () => {
    const { c, auth } = build();
    c.register({} as never); expect(auth.register).toHaveBeenCalled();
    c.login({} as never); expect(auth.login).toHaveBeenCalled();
    c.logout(u); expect(auth.logout).toHaveBeenCalledWith(u);
    c.google({} as never); expect(auth.googleAuth).toHaveBeenCalled();
    c.verifyEmail({ token: 't' } as never); expect(auth.verifyEmail).toHaveBeenCalledWith('t');
    c.forgotPassword({ email: 'e' } as never); expect(auth.forgotPassword).toHaveBeenCalledWith('e');
    c.resetPassword({ token: 't', password: 'p' } as never); expect(auth.resetPassword).toHaveBeenCalledWith('t', 'p');
    c.resend(u); expect(auth.resendVerification).toHaveBeenCalledWith('u1');
    c.me(u); expect(auth.me).toHaveBeenCalledWith('u1');
  });
  it('googleClient devuelve el clientId del entorno o null', () => {
    const { c } = build();
    const res = c.googleClient();
    expect(res).toHaveProperty('clientId');
  });
});
