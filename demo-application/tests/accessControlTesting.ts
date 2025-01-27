// todo: replace this with from 'access-control-testing' later
import { Act, Resource, User } from '../../src/api'

const test = async () => {
  // todo: seed the database with testing data

  const user1 = new User('user1', 'password')
  const user2 = new User('user2', 'password')
  const adminUser1 = new User('admin', 'admin')

  const todoResource = new Resource('Todo')

  // oder: Resource ist abstract
  // class TodoResource extends Resource {}
  // new TodoResource('Todo')

  // todo: type of identifier should be supplied by user
  user1.canView(todoResource, 123)

  console.log('======')
  // that way, tool users can use .env variables which would not be possible with the config file
  const act = new Act('http://localhost:3333')
  await act.scan()
}

test()
