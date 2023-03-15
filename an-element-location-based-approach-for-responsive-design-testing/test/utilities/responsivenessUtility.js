const fs = require("fs");

module.exports = class ResponsivenessUtility {
  async addTextAboveElement(element, text) {
    await browser.execute(
      (el, txt) => {
        const div = document.createElement("div");
        div.innerHTML = txt;
        div.style.position = "absolute";
        div.style.top = el.getBoundingClientRect().top - 20 + "px";
        div.style.left = el.getBoundingClientRect().left + "px";
        div.style.color = "red";
        document.body.appendChild(div);
      },
      element,
      text
    );
  }

  async takeScreenshot() {
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const fileName = `screenshots/screenshot-${timestamp}.png`;
    const screenshot = await browser.takeScreenshot();
    fs.writeFileSync(fileName, screenshot, "base64");
  }

  async resizeBrowser(width, height) {
    await browser.setWindowSize(width, height);
  }

  async getElementData(element) {
    const location = await element.getLocation();
    const size = await element.getSize();
    return {
      x: location.x,
      y: location.y,
      width: size.width,
      height: size.height,
    };
  }

  async verifyElementOnTheRight(elementOnTheRight, elementOnTheLeft) {
    if (
      (await elementOnTheRight.isDisplayed()) &&
      (await elementOnTheLeft.isDisplayed())
    ) {
      const elementOnTheRightData = await this.getElementData(
        elementOnTheRight
      );
      const elementOnTheLeftData = await this.getElementData(elementOnTheLeft);
      try {
        expect(elementOnTheRightData.x).toBeGreaterThan(
          elementOnTheLeftData.x + elementOnTheLeftData.width
        );
      } catch (error) {
        await browser.execute(
          (firstEl, secondEl) => {
            firstEl.style.border = "3px solid red";
            secondEl.style.border = "3px solid red";
          },
          elementOnTheRight,
          elementOnTheLeft
        );
        await this.addTextAboveElement(
          elementOnTheRight,
          "Element on the right"
        );
        await this.addTextAboveElement(elementOnTheLeft, "Element on the left");
        this.takeScreenshot();
      }
    } else {
      throw new Error("Provided elements are not displayed!");
    }
  }

  async verifyElementIsAbove(elementAbove, elementBelow) {
    if (
      (await elementAbove.isDisplayed()) &&
      (await elementBelow.isDisplayed())
    ) {
      const elementAboveData = await this.getElementData(elementAbove);
      const elementBelowData = await this.getElementData(elementBelow);
      try {
        expect(elementAboveData.y + elementAboveData.height).toBeLessThan(
          elementBelowData.y
        );
      } catch (error) {
        await browser.execute(
          (firstEl, secondEl) => {
            firstEl.style.border = "3px solid red";
            secondEl.style.border = "3px solid red";
          },
          elementAbove,
          elementBelow
        );
        await this.addTextAboveElement(elementAbove, "Element above");
        await this.addTextAboveElement(elementBelow, "Element below");
        this.takeScreenshot();
      }
    } else {
      throw new Error("Provided elements are not displayed!");
    }
  }

  async verifyElementAlignment(elements, position) {
    if (elements.length === 1) {
      throw new RangeError(
        "The list needs to contain more than one element for alignment verification!"
      );
    }

    let elementTopPositions,
      elementLeftPositions,
      elementRightPositions,
      elementCenterPositions = [];

    for (const element of elements) {
      if (!(await element.isDisplayed())) {
        throw new Error(
          "One or more of the provided elements are not displayed!"
        );
      }
    }
    switch (position) {
      case "HorizontallyAll":
        elementTopPositions = [];
        elementBottomPositions = [];
        for (const element of elements) {
          const elementData = await this.getElementData(element);
          elementTopPositions.push(elementData.y);
          elementBottomPositions.push(elementData.y + elementData.height);
        }
        expect(new Set(elementTopPositions).size).toBe(1);
        expect(new Set(elementBottomPositions).size).toBe(1);
        break;
      case "HorizontallyTop":
        elementTopPositions = [];
        for (const element of elements) {
          const elementData = await this.getElementData(element);
          elementTopPositions.push(elementData.y);
        }
        expect(new Set(elementTopPositions).size).toBe(1);
        break;
      case "HorizontallyBottom":
        const elementBottomPositions = [];
        for (const element of elements) {
          const elementData = await this.getElementData(element);
          elementBottomPositions.push(elementData.y + elementData.height);
        }
        expect(new Set(elementBottomPositions).size).toBe(1);
        break;
      case "HorizontallyCentered":
        elementCenterPositions = [];
        for (const element of elements) {
          const elementData = await this.getElementData(element);
          elementCenterPositions.push(elementData.y + elementData.height / 2);
        }
        expect(new Set(elementCenterPositions).size).toBe(1);
        break;
      case "VerticallyAll":
        elementLeftPositions = [];
        elementRightPositions = [];
        for (const element of elements) {
          const elementData = await this.getElementData(element);
          elementLeftPositions.push(elementData.x);
          elementRightPositions.push(elementData.x + elementData.width);
        }
        expect(new Set(elementLeftPositions).size).toBe(1);
        expect(new Set(elementRightPositions).size).toBe(1);
        break;
      case "VerticallyLeft":
        elementLeftPositions = [];
        for (const element of elements) {
          const elementData = await this.getElementData(element);
          elementLeftPositions.push(elementData.x);
        }
        expect(new Set(elementLeftPositions).size).toBe(1);
        break;
      case "VerticallyRight":
        elementRightPositions = [];
        for (const element of elements) {
          const elementData = await this.getElementData(element);
          elementRightPositions.push(elementData.x + elementData.width);
        }
        expect(new Set(elementRightPositions).size).toBe(1);
        break;
      case "VerticallyCentered":
        elementCenterPositions = [];
        for (let element of elements) {
          const elementData = this.getElementData(element);
          elementCenterPositions.push(elementData.x + elementData.width / 2);
        }
        expect(
          elementCenterPositions.filter(
            (pos) => pos === elementCenterPositions[0]
          )
        ).toHaveLength(elements.length);
        break;
    }
  }
};
