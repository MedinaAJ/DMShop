import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mock sequelize ─────────────────────────────────────────────────────────
vi.mock('sequelize', async () => {
  const actual = await vi.importActual('sequelize');
  return actual;
});

// ── Mock models ────────────────────────────────────────────────────────────
vi.mock('../../models/customer-group.model.js', () => ({
  CustomerGroup: {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../models/customer-group-lang.model.js', () => ({
  CustomerGroupLang: {
    findOrCreate: vi.fn(),
    upsert: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../models/user-group.model.js', () => ({
  UserGroup: {
    findAll: vi.fn(),
    findOrCreate: vi.fn(),
    destroy: vi.fn(),
  },
}));

vi.mock('../../models/user.model.js', () => ({
  User: {
    findByPk: vi.fn(),
    findAll: vi.fn(),
  },
}));

vi.mock('@dmshop/shared', () => ({
  ErrorCode: {
    NOT_FOUND: 'NOT_FOUND',
    FORBIDDEN: 'FORBIDDEN',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
  },
}));

// ── Import after mocks ─────────────────────────────────────────────────────
import { CustomerGroup } from '../../models/customer-group.model.js';
import { CustomerGroupLang } from '../../models/customer-group-lang.model.js';
import { UserGroup } from '../../models/user-group.model.js';
import { User } from '../../models/user.model.js';
import { customerGroupService } from './service.js';

// ── Test helpers ───────────────────────────────────────────────────────────
function makeGroup(id: number, overrides = {}) {
  return {
    id,
    reduction: 0,
    price_display_method: 0,
    show_prices: true,
    deleted: false,
    translations: [{ id_customer_group: id, id_lang: 1, name: `Grupo ${id}` }],
    update: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('customerGroupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. list() ────────────────────────────────────────────────────────────
  it('list() devuelve grupos con traducciones', async () => {
    const mockGroups = [makeGroup(1), makeGroup(2), makeGroup(3)];
    vi.mocked(CustomerGroup.findAll).mockResolvedValue(mockGroups as any);

    const result = await customerGroupService.list();

    expect(CustomerGroup.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deleted: false },
        include: expect.arrayContaining([
          expect.objectContaining({ as: 'translations' }),
        ]),
      }),
    );
    expect(result).toHaveLength(3);
  });

  // ── 2. create() ─────────────────────────────────────────────────────────
  it('create() crea grupo con nombre correcto', async () => {
    const newGroup = makeGroup(4);
    vi.mocked(CustomerGroup.create).mockResolvedValue(newGroup as any);
    vi.mocked(CustomerGroupLang.create).mockResolvedValue({ id_customer_group: 4, id_lang: 1, name: 'VIP' } as any);
    vi.mocked(CustomerGroup.findOne).mockResolvedValue(newGroup as any);

    const result = await customerGroupService.create({
      reduction: 10,
      show_prices: true,
      translations: [{ id_lang: 1, name: 'VIP' }],
    });

    expect(CustomerGroup.create).toHaveBeenCalledWith(
      expect.objectContaining({ reduction: 10, show_prices: true }),
    );
    expect(result).toEqual(newGroup);
  });

  // ── 3. delete(1) lanza error (grupo protegido) ──────────────────────────
  it('delete(1) lanza error para grupo protegido', async () => {
    await expect(customerGroupService.delete(1)).rejects.toThrow(
      /predefinidos/,
    );
    expect(CustomerGroup.findOne).not.toHaveBeenCalled();
  });

  it('delete(2) lanza error para grupo protegido', async () => {
    await expect(customerGroupService.delete(2)).rejects.toThrow();
  });

  it('delete(3) lanza error para grupo protegido', async () => {
    await expect(customerGroupService.delete(3)).rejects.toThrow();
  });

  // ── 4. delete(4) soft delete correcto ───────────────────────────────────
  it('delete(4) hace soft delete correcto', async () => {
    const group = makeGroup(4);
    vi.mocked(CustomerGroup.findOne).mockResolvedValue(group as any);

    await customerGroupService.delete(4);

    expect(group.update).toHaveBeenCalledWith({ deleted: true });
  });

  // ── 5. assignUser() crea UserGroup ──────────────────────────────────────
  it('assignUser() crea UserGroup', async () => {
    const group = makeGroup(3);
    const user = { id: 42, email: 'test@test.com' };
    vi.mocked(CustomerGroup.findOne).mockResolvedValue(group as any);
    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    const record = { id_user: 42, id_customer_group: 3 };
    vi.mocked(UserGroup.findOrCreate).mockResolvedValue([record as any, true]);

    const result = await customerGroupService.assignUser(3, 42);

    expect(UserGroup.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_user: 42, id_customer_group: 3 },
      }),
    );
    expect(result).toEqual(record);
  });

  // ── 6. removeUser() elimina UserGroup ───────────────────────────────────
  it('removeUser() elimina UserGroup', async () => {
    vi.mocked(UserGroup.destroy).mockResolvedValue(1);

    await customerGroupService.removeUser(3, 42);

    expect(UserGroup.destroy).toHaveBeenCalledWith({
      where: { id_customer_group: 3, id_user: 42 },
    });
  });

  it('removeUser() lanza error si el usuario no pertenece al grupo', async () => {
    vi.mocked(UserGroup.destroy).mockResolvedValue(0);

    await expect(customerGroupService.removeUser(3, 99)).rejects.toThrow();
  });

  // ── 7. getUsers() devuelve usuarios del grupo ────────────────────────────
  it('getUsers(groupId) devuelve usuarios del grupo', async () => {
    const group = makeGroup(3);
    vi.mocked(CustomerGroup.findOne).mockResolvedValue(group as any);
    vi.mocked(UserGroup.findAll).mockResolvedValue([
      { id_user: 1, id_customer_group: 3 },
      { id_user: 2, id_customer_group: 3 },
    ] as any);
    const users = [
      { id: 1, email: 'a@a.com', first_name: 'Ana' },
      { id: 2, email: 'b@b.com', first_name: 'Bob' },
    ];
    vi.mocked(User.findAll).mockResolvedValue(users as any);

    const result = await customerGroupService.getUsers(3);

    expect(UserGroup.findAll).toHaveBeenCalledWith({ where: { id_customer_group: 3 } });
    expect(result).toHaveLength(2);
  });
});
