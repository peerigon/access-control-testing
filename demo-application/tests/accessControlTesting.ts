// todo: replace this with from 'access-control-testing' later
import { Act } from '../../src/api'

const test = async () => {
  // todo: seed the database with testing data

  //const users = [new User('admin', 'admin'), new User('user', 'password')]

  console.log('======')
  const act = new Act()
  await act.scan()
}

test()
