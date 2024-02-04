import com.pholser.junit.quickcheck.Property;
import com.pholser.junit.quickcheck.runner.JUnitQuickcheck;
import org.assertj.core.api.Assertions;
import org.junit.runner.RunWith;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@RunWith(JUnitQuickcheck.class)
public class ListReversalTest {

    @Property
    public void propReverseList(List<Integer> list) {
        List<Integer> reversedList = new ArrayList<>(list);
        Collections.reverse(reversedList);
        Collections.reverse(reversedList);
        Assertions.assertThat(reversedList).isEqualTo(list);
    }
}
