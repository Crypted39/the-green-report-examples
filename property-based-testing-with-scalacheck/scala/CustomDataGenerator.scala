import org.scalacheck.Prop.forAll
import org.scalacheck.Gen

object CustomDataGenerator extends App {
  val propSquareRoot = forAll(Gen.posNum[Double]) { num =>
    Math.sqrt(num * num) == num
  }
  propSquareRoot.check()
}
