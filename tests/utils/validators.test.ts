import { required, validEmail, minLength } from '../../src/utils/validators';

describe('required', () => {
  const validate = required('Informe o e-mail.');

  it('aceita texto preenchido', () => {
    expect(validate('algo')).toBe(true);
  });

  it.each([undefined, '', '   '])('rejeita %p', (value) => {
    expect(validate(value)).toBe('Informe o e-mail.');
  });
});

describe('validEmail', () => {
  it.each(['admin@fiap.com', 'ana.souza@aluno.fiap.com'])('aceita %s', (value) => {
    expect(validEmail(value)).toBe(true);
  });

  it.each([undefined, '', 'admin', 'admin@', 'admin@fiap', 'a b@fiap.com'])(
    'rejeita %p',
    (value) => {
      expect(validEmail(value)).toBe('Informe um e-mail válido.');
    }
  );

  it('ignora espaços em volta', () => {
    expect(validEmail('  admin@fiap.com  ')).toBe(true);
  });
});

describe('minLength', () => {
  const validate = minLength(6);

  it('aceita no limite', () => {
    expect(validate('123456')).toBe(true);
  });

  it('rejeita abaixo do limite', () => {
    expect(validate('12345')).toBe('Use ao menos 6 caracteres.');
  });

  it('trata ausente como vazio', () => {
    expect(validate(undefined)).toBe('Use ao menos 6 caracteres.');
  });
});
