import org.scalatest.funsuite.AnyFunSuite
import org.scalatestplus.scalacheck.ScalaCheckPropertyChecks

class ScalaTestIntegration extends AnyFunSuite with ScalaCheckPropertyChecks {
  test("reverseList should maintain equality") {
    forAll { (list: List[Int]) =>
      assert(list.reverse.reverse == list)
    }
  }
}