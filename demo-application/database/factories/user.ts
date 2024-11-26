import User from '#models/user'
import Factory from '@adonisjs/lucid/factories'

export const UserFactory = Factory.define(User, ({ faker }) => {
  return {
    username: faker.internet.username(),
    email: faker.internet.email(),
    password: faker.internet.password(),
  }
}).build()
