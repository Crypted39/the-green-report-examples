import org.scalacheck.Prop.forAll

object ListReversal extends App {
  val propReverseList = forAll { (list: List[Int]) =>
    list.reverse.reverse == list
  }
  propReverseList.check()
}
