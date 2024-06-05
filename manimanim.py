from manim import *

shits = ["A", "B", "LEFT", "RIGHT", "HOME"]

#def callback(cell, scene, i):
#    cell = cell.copy()
#    if isinstance(cell, Text):
#        #cell.animate.text = "LAST_"+cell.text
#        #scene.play(cell.animate.text)
#        cell.text = "LAST_"+cell.text
#        scene.play(Transform(cells[i], cell))
#    return cell

class Gyatt(MovingCameraScene):
    def construct(self):
        #circle = Circle()
        #square = Square()
        #square.flip(RIGHT)
        #square.rotate(-3 * TAU / 8)
        #circle.set_fill(PINK, opacity=0.5)

        #self.play(Create(square))
        #self.play(Transform(square, circle))
        #self.play(FadeOut(square))
        self.play(Write(Text("Keystates", font_size=36).move_to([0,3.5,0])))
        cells = []
        lastText = []
        for i in range(0, len(shits)):
            text = Text(shits[i]+": 0x0", font_size=24, font="consolas", color=GREEN)
            box = Rectangle(WHITE, 2, 2).move_to([(i*2)-4, 2, 0]) #oh yeah function chaining
            text.move_to(box)

            #cells.append(text)
            lastText.append(text)
            cells.append(box)

            self.play(Create(box), run_time=0.25) #i gotta bust out the list comprehension
            self.play(Write(text), run_time=0.25)

        #group = VGroup(*[callback(cell, self, i) for i, cell in enumerate(cells)])
        newrow = VGroup(*[cell.copy() for cell in cells])
        self.play(newrow.animate.move_to([0,-0,0])) #LO
        for i in range(0, len(shits)):
            text = Text("LAST_"+lastText[i].text, font_size=16, font="consolas", color=BLUE)
            #text = lastText[i].copy()
            #text.text = "LAST_"+text.text
            text.move_to(lastText[i])
            text.set_y(newrow.get_y())
            self.play(Transform(lastText[i].copy(), text), run_time=0.5)
            newrow.add(text)
        
        for text in lastText:
            cells.append(text.copy())
        cells.append(newrow.copy())
        
        self.play(self.camera.frame.animate.scale(2).move_to(DOWN*4))

        for j in range(1, 5):
            nr = VGroup(*[cell.copy() for cell in cells])
            #for obj in nr.submobjects:
            #    print(type(obj).__name__)
            #    if(isinstance(obj, Text)):
            #        obj.__init__("LAST_LAST_"+obj.text)
            #        obj.color = BLUE
            #    if(isinstance(obj, VGroup)):
            #        for subobj in obj.submobjects:
            #            if(isinstance(obj, Text)):
            #                subobj.__init__("LAST_LAST_"+subobj.text)
            #                #subobj.text = "LAST_LAST_"+subobj.text
            #                subobj.color = BLUE
            #            print(type(obj).__name__ + " -> " + type(subobj).__name__)
            self.play(nr.animate.move_to([0,-(3**j),0]))
            cells.append(nr.copy())
            self.play(self.camera.frame.animate.scale(j/2).move_to(DOWN*4*(j+1)))

        #self.play(*[Create(i) for i in cells])