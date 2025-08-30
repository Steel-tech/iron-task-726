const prisma = require('../../lib/prisma')
const { NotFoundError, ValidationError } = require('../../utils/errors')

class UserService {
  /**
   * Find user by email
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        unionMember: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  /**
   * Find user by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        unionMember: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  /**
   * Create new user
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  async create(userData) {
    const { email, password, name, role, companyId, unionMember, phoneNumber } =
      userData

    // Check if user already exists
    const existingUser = await this.findByEmail(email)
    if (existingUser) {
      throw new ValidationError('User already exists')
    }

    return await prisma.user.create({
      data: {
        email,
        password,
        name,
        role: role || 'WORKER',
        companyId,
        unionMember: unionMember || false,
        phoneNumber,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        unionMember: true,
        phoneNumber: true,
        createdAt: true,
      },
    })
  }

  /**
   * Update user
   * @param {string} id
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  async update(id, updateData) {
    const user = await this.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    return await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        unionMember: true,
        phoneNumber: true,
        updatedAt: true,
      },
    })
  }

  /**
   * Find users by company
   * @param {string} companyId
   * @param {Object} options
   * @returns {Promise<Array>}
   */
  async findByCompany(companyId, options = {}) {
    const { page = 1, limit = 20, role } = options
    const skip = (page - 1) * limit

    const where = { companyId }
    if (role) {
      where.role = role
    }

    return await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        unionMember: true,
        phoneNumber: true,
        createdAt: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get user with password (for authentication)
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findWithPassword(email) {
    return await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        companyId: true,
      },
    })
  }
}

module.exports = new UserService()
