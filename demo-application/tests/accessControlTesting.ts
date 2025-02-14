// todo: replace this with from 'access-control-testing' later
import { Act, Resource, User } from '../../src/api/index.ts'

const test = async () => {
  // todo: seed the database with testing data

  const user1 = new User('niklas.haug@tha.de', 'niklas.haug@tha.de')
  const user2 = new User('user2', 'password')
  const adminUser1 = new User('admin', 'admin')

  const todoResource = new Resource('Todo')

  // oder: Resource ist abstract
  // class TodoResource extends Resource {}
  // new TodoResource('Todo')

  // todo: type of identifier should be supplied by user
  user1.canView(todoResource, 123)

  const resources = [todoResource]
  const users = [user1, user2, adminUser1]

  console.log('======')
  const act = new Act({
    apiBaseUrl: 'http://localhost:3333/',
    openApiUrl: 'http://localhost:3333/openapi.yml',
    users,
    resources,
  })
  await act.scan()
}

test()
