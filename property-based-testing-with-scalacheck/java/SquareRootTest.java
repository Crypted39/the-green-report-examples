import com.pholser.junit.quickcheck.Property;
import com.pholser.junit.quickcheck.runner.JUnitQuickcheck;
import org.assertj.core.api.Assertions;
import org.junit.runner.RunWith;

@RunWith(JUnitQuickcheck.class)
public class SquareRootTest {

    @Property
    public void propSquareRoot(double num) {
        // Ensure that generated 'num' is non-negative
        Assertions.assertThat(num).isGreaterThanOrEqualTo(0.0);
        Assertions.assertThat(Math.sqrt(num * num)).isEqualTo(num);
    }
}
