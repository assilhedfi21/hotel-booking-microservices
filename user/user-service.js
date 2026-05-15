const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./user-db');

const JWT_SECRET = process.env.JWT_SECRET || 'hotel-booking-secret-key-2024';

const UserService = {
  // Create a new user
  CreateUser: (call, callback) => {
    try {
      const { name, email, password, phone } = call.request;

      if (!name || !email || !password) {
        return callback(null, {
          success: false,
          message: 'Name, email and password are required'
        });
      }

      // Check if email already exists
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        return callback(null, {
          success: false,
          message: 'Email already registered'
        });
      }

      const id = uuidv4();
      const hashedPassword = bcrypt.hashSync(password, 10);
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO users (id, name, email, password, phone, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, email, hashedPassword, phone || '', now, now);

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

      console.log(`[UserService] User created: ${id} - ${email}`);

      callback(null, {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at,
        success: true,
        message: 'User created successfully'
      });
    } catch (err) {
      console.error('[UserService] CreateUser error:', err);
      callback(null, { success: false, message: err.message });
    }
  },

  // Get user by ID
  GetUser: (call, callback) => {
    try {
      const { id } = call.request;
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

      if (!user) {
        return callback(null, { success: false, message: 'User not found' });
      }

      callback(null, {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at,
        success: true,
        message: 'User found'
      });
    } catch (err) {
      console.error('[UserService] GetUser error:', err);
      callback(null, { success: false, message: err.message });
    }
  },

  // Get all users
  GetAllUsers: (call, callback) => {
    try {
      const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();

      callback(null, {
        users: users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          created_at: u.created_at,
          success: true,
          message: ''
        })),
        success: true,
        message: `Found ${users.length} users`
      });
    } catch (err) {
      console.error('[UserService] GetAllUsers error:', err);
      callback(null, { users: [], success: false, message: err.message });
    }
  },

  // Update user
  UpdateUser: (call, callback) => {
    try {
      const { id, name, email, phone } = call.request;
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

      if (!user) {
        return callback(null, { success: false, message: 'User not found' });
      }

      const now = new Date().toISOString();
      db.prepare(`
        UPDATE users SET name = ?, email = ?, phone = ?, updated_at = ?
        WHERE id = ?
      `).run(name || user.name, email || user.email, phone || user.phone, now, id);

      const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

      console.log(`[UserService] User updated: ${id}`);

      callback(null, {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        created_at: updated.created_at,
        success: true,
        message: 'User updated successfully'
      });
    } catch (err) {
      console.error('[UserService] UpdateUser error:', err);
      callback(null, { success: false, message: err.message });
    }
  },

  // Delete user
  DeleteUser: (call, callback) => {
    try {
      const { id } = call.request;
      const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);

      if (!user) {
        return callback(null, { success: false, message: 'User not found' });
      }

      db.prepare('DELETE FROM users WHERE id = ?').run(id);

      console.log(`[UserService] User deleted: ${id}`);
      callback(null, { success: true, message: 'User deleted successfully' });
    } catch (err) {
      console.error('[UserService] DeleteUser error:', err);
      callback(null, { success: false, message: err.message });
    }
  },

  // Authenticate user
  AuthenticateUser: (call, callback) => {
    try {
      const { email, password } = call.request;
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

      if (!user) {
        return callback(null, { success: false, message: 'Invalid email or password' });
      }

      const valid = bcrypt.compareSync(password, user.password);
      if (!valid) {
        return callback(null, { success: false, message: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log(`[UserService] User authenticated: ${user.id}`);

      callback(null, {
        success: true,
        message: 'Authentication successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          created_at: user.created_at,
          success: true,
          message: ''
        }
      });
    } catch (err) {
      console.error('[UserService] AuthenticateUser error:', err);
      callback(null, { success: false, message: err.message });
    }
  }
};

module.exports = UserService;